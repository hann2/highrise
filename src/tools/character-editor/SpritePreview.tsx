import { useEffect, useRef } from "preact/hooks";
import { ImageName, RESOURCES } from "../../../resources/resources";
import { HUMAN_RADIUS } from "../../highrise/constants/constants";
import { CharacterData } from "../../highrise/characters/CharacterData";
import {
  DEFAULT_LEG_COLORS,
  FOOT_FORWARD,
  FOOT_LENGTH,
  FOOT_WIDTH,
  HIP_WIDTH,
  LEG_THICKNESS,
  LegColors,
} from "../../highrise/creature-stuff/Legs";

/** Pixels per meter */
const SCALE = 170;
/** How far each foot is from under its hip, mid-stride (meters) */
const STRIDE = 0.15;

function loadImage(name: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = RESOURCES.images[name as ImageName];
  });
}

/** `image` multiplied by `color`, the way Pixi tints a sprite */
function tinted(image: HTMLImageElement, color: string): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const context = canvas.getContext("2d")!;
  context.drawImage(image, 0, 0);
  context.globalCompositeOperation = "multiply";
  context.fillStyle = color;
  context.fillRect(0, 0, image.width, image.height);
  // The fill covered the transparent parts too
  context.globalCompositeOperation = "destination-in";
  context.drawImage(image, 0, 0);
  return canvas;
}

/**
 * The character unarmed, facing up, mid-stride so their legs show, laid out
 * the way `BodySprite` and `HumanSprite` do it in the game.
 */
export function SpritePreview({
  textures,
  legs = DEFAULT_LEG_COLORS,
  size = 160,
}: {
  textures: CharacterData["textures"];
  legs?: LegColors;
  size?: number;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    const parts = [
      textures.torso,
      textures.head,
      textures.leftArm,
      textures.rightArm,
      textures.leftHand,
      textures.rightHand,
      "leg",
      "foot",
    ];
    Promise.all(parts.map(loadImage))
      .then(
        ([torso, head, leftArm, rightArm, leftHand, rightHand, leg, foot]) => {
          const context = canvas.current?.getContext("2d");
          if (cancelled || !context) {
            return;
          }
          const ratio = window.devicePixelRatio;
          context.setTransform(1, 0, 0, 1, 0, 0);
          context.clearRect(0, 0, size * ratio, size * ratio);
          context.setTransform(
            ratio,
            0,
            0,
            ratio,
            (size * ratio) / 2,
            (size * ratio) / 2,
          );
          context.scale(SCALE * (size / 160), SCALE * (size / 160));
          // Facing up instead of right, a little low so the hands fit
          context.translate(0, 0.1);
          context.rotate(-Math.PI / 2);

          const baseScale = (HUMAN_RADIUS * 2) / torso.height;
          const armThickness = baseScale * leftArm.height;
          const shoulder = HUMAN_RADIUS - armThickness / 2;

          const drawAt = (
            image: CanvasImageSource,
            [x, y]: [number, number],
            width: number,
            height: number,
            angle = 0,
          ) => {
            context.save();
            context.translate(x, y);
            context.rotate(angle);
            context.drawImage(image, -width / 2, -height / 2, width, height);
            context.restore();
          };

          // The left foot forward, the right back
          const pants = tinted(leg, legs.pants);
          const shoes = tinted(foot, legs.shoes);
          for (const side of [-1, 1]) {
            const along = -side * STRIDE;
            drawAt(
              pants,
              [along / 2, side * HIP_WIDTH],
              Math.abs(along) + LEG_THICKNESS,
              LEG_THICKNESS,
            );
          }
          for (const side of [-1, 1]) {
            const along = -side * STRIDE;
            drawAt(
              shoes,
              [along + FOOT_FORWARD, side * HIP_WIDTH],
              FOOT_LENGTH,
              FOOT_WIDTH,
            );
          }

          const arms: [HTMLImageElement, HTMLImageElement, number][] = [
            [leftArm, leftHand, -1],
            [rightArm, rightHand, 1],
          ];
          for (const [arm, , side] of arms) {
            const from: [number, number] = [0, side * shoulder];
            const to: [number, number] = [0.3, side * 0.2];
            const span: [number, number] = [to[0] - from[0], to[1] - from[1]];
            drawAt(
              arm,
              [(from[0] + to[0]) / 2, (from[1] + to[1]) / 2],
              Math.hypot(...span),
              armThickness,
              Math.atan2(span[1], span[0]),
            );
          }
          for (const [, hand, side] of arms) {
            drawAt(hand, [0.3, side * 0.2], armThickness, armThickness);
          }
          drawAt(
            torso,
            [0, 0],
            torso.width * baseScale,
            torso.height * baseScale,
          );
          drawAt(head, [0, 0], head.width * baseScale, head.height * baseScale);
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [Object.values(textures).join(), legs.pants, legs.shoes, size]);

  return (
    <canvas
      ref={canvas}
      class="sprite-preview"
      width={size * window.devicePixelRatio}
      height={size * window.devicePixelRatio}
      style={{ width: `${size}px`, height: `${size}px` }}
    />
  );
}
