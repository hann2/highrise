/**
 * Renders a 3D model (glTF, from REFERENCES/<gun>/<folder>/scene.gltf) straight on from one side, with no
 * perspective and even lighting, into a PNG to draw over like a photo. Models come in any orientation, so with
 * no view given it renders all six (from +x, -x, +y, -y, +z, -z) on one sheet to pick from.
 *
 * Runs three.js in headless Chromium: the page imports it from node_modules and the model from its folder, both
 * served by intercepting requests to a made-up origin.
 */
import fs from "fs";
import path from "path";
import { newPage } from "./browser";
import { REPO } from "./gun";

const ORIGIN = "http://model.local";
const THREE = path.join(REPO, "node_modules/three");

/** An axis, as "+x", "-z"... */
export type Axis = `${"+" | "-"}${"x" | "y" | "z"}`;
export const AXES: readonly Axis[] = ["+x", "-x", "+y", "-y", "+z", "-z"];

export interface ModelView {
  /** Where the camera is, looking back at the model: "+x" looks from +x toward -x */
  readonly from: Axis;
  /** Which way is up in the picture */
  readonly up: Axis;
  /** Mirror the picture left to right */
  readonly mirror?: boolean;
}

export interface ModelRender {
  readonly file: string;
  readonly width: number;
  readonly height: number;
  /** Model units a pixel, so the render's scale can be checked against the real gun */
  readonly unitsPerPixel: number;
  /** The model's size along x, y and z, in its units */
  readonly size: readonly [number, number, number];
}

const TYPES: Record<string, string> = {
  ".js": "text/javascript",
  ".gltf": "model/gltf+json",
  ".bin": "application/octet-stream",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
};

/** A default up for looking from an axis: +y, or +z when looking along y */
export function defaultUp(from: Axis): Axis {
  return from[1] === "y" ? "+z" : "+y";
}

/**
 * Renders the model in `folder` from each of `views`, `width` pixels across its longest side, onto a transparent
 * background (`background` to put it on a color). Returns each render.
 */
export async function renderModel(
  folder: string,
  views: readonly (ModelView & { out: string })[],
  { width = 2400, background }: { width?: number; background?: string } = {},
): Promise<ModelRender[]> {
  const gltf = fs.readdirSync(folder).find((f) => /\.(gltf|glb)$/.test(f));
  if (!gltf) {
    throw new Error(`No .gltf or .glb in ${folder}`);
  }
  const page = await newPage({ width: 800, height: 600 }, 1);
  await page.route(`${ORIGIN}/**`, async (route) => {
    const url = new URL(route.request().url());
    const [, root, ...rest] = decodeURIComponent(url.pathname).split("/");
    const base = root === "three" ? THREE : root === "model" ? folder : null;
    const file = base && path.join(base, ...rest);
    if (!file || !file.startsWith(base) || !fs.existsSync(file)) {
      await route.fulfill({ status: 404, body: "" });
      return;
    }
    await route.fulfill({
      body: fs.readFileSync(file),
      contentType:
        TYPES[path.extname(file).toLowerCase()] ?? "application/octet-stream",
      headers: { "access-control-allow-origin": "*" },
    });
  });
  await page.goto(`${ORIGIN}/page`).catch(() => {});
  await page.setContent(
    `<html><body style="margin:0"><script type="importmap">${JSON.stringify({
      imports: {
        three: `${ORIGIN}/three/build/three.module.js`,
        "three/addons/": `${ORIGIN}/three/examples/jsm/`,
      },
    })}</script></body></html>`,
  );
  const results: ModelRender[] = [];
  for (const view of views) {
    const result = await page.evaluate(
      async ({ url, view, width, background }) => {
        const THREE = await import("three" as string);
        const { GLTFLoader } = await import(
          "three/addons/loaders/GLTFLoader.js" as string
        );
        const w = window as any;
        if (!w.__model) {
          w.__model = (await new GLTFLoader().loadAsync(url)).scene;
        }
        const model = w.__model;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const axis = (a: string) => {
          const v = new THREE.Vector3();
          v[a[1] as "x" | "y" | "z"] = a[0] === "-" ? -1 : 1;
          return v;
        };
        const from = axis(view.from);
        const up = axis(view.up);
        const right = new THREE.Vector3().crossVectors(up, from);
        // The model's extent across and up the picture
        const across = Math.abs(right.dot(size));
        const tall = Math.abs(up.dot(size));
        const pad = 1.04;
        const unitsPerPixel = (Math.max(across, tall) * pad) / width;
        const pw = Math.ceil((across * pad) / unitsPerPixel);
        const ph = Math.ceil((tall * pad) / unitsPerPixel);
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          preserveDrawingBuffer: true,
        });
        renderer.setPixelRatio(1);
        renderer.setSize(pw, ph);
        renderer.setClearColor(background ?? 0x000000, background ? 1 : 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        const scene = new THREE.Scene();
        scene.add(model);
        // Even light: a sky above and a floor below, and a soft light from the camera, so faces read as planes
        // without hard shadows
        scene.add(new THREE.HemisphereLight(0xffffff, 0x808080, 1.6));
        const key = new THREE.DirectionalLight(0xffffff, 1.4);
        key.position.copy(from).add(up.clone().multiplyScalar(0.5));
        scene.add(key);
        const depth = size.length() * 2;
        const camera = new THREE.OrthographicCamera(
          (-pw / 2) * unitsPerPixel,
          (pw / 2) * unitsPerPixel,
          (ph / 2) * unitsPerPixel,
          (-ph / 2) * unitsPerPixel,
          0.001,
          depth * 2,
        );
        camera.up.copy(up);
        camera.position.copy(center).add(from.clone().multiplyScalar(depth));
        camera.lookAt(center);
        renderer.render(scene, camera);
        let canvas: HTMLCanvasElement = renderer.domElement;
        if (view.mirror) {
          const flipped = document.createElement("canvas");
          flipped.width = pw;
          flipped.height = ph;
          const g = flipped.getContext("2d")!;
          g.translate(pw, 0);
          g.scale(-1, 1);
          g.drawImage(canvas, 0, 0);
          canvas = flipped;
        }
        const png = canvas.toDataURL("image/png");
        renderer.dispose();
        scene.remove(model);
        return {
          png,
          width: pw,
          height: ph,
          unitsPerPixel,
          size: [size.x, size.y, size.z] as [number, number, number],
        };
      },
      {
        url: `${ORIGIN}/model/${gltf}`,
        view,
        width,
        background,
      },
    );
    fs.mkdirSync(path.dirname(view.out), { recursive: true });
    fs.writeFileSync(view.out, Buffer.from(result.png.split(",")[1], "base64"));
    results.push({
      file: view.out,
      width: result.width,
      height: result.height,
      unitsPerPixel: result.unitsPerPixel,
      size: result.size,
    });
  }
  await page.close();
  return results;
}
