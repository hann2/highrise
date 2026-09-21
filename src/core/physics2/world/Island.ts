import type { Body } from "../body/Body";
import type { Equation } from "../equations/Equation";

/** An island of bodies connected by equations. */
export interface Island {
  bodies: readonly Body[];
  equations: readonly Equation[];
}

interface Node {
  body: Body;
  neighbors: Node[];
  equations: Equation[];
  visited: boolean;
}

/**
 * Split bodies and equations into independent islands.
 * Bodies that share equations are grouped together.
 */
export function splitIntoIslands(
  bodies: Iterable<Body>,
  equations: Equation[],
): Island[] {
  // Create nodes for each body
  const bodyToNode = new Map<Body, Node>();
  const dynamicNodes: Node[] = [];

  for (const body of bodies) {
    const node: Node = {
      body,
      neighbors: [],
      equations: [],
      visited: false,
    };
    bodyToNode.set(body, node);
    if (body.motion === "dynamic") {
      dynamicNodes.push(node);
    }
  }

  // Add connectivity from equations
  for (const eq of equations) {
    const nodeA = bodyToNode.get(eq.bodyA);
    const nodeB = bodyToNode.get(eq.bodyB);
    if (nodeA && nodeB) {
      nodeA.neighbors.push(nodeB);
      nodeB.neighbors.push(nodeA);
      nodeA.equations.push(eq);
      nodeB.equations.push(eq);
    }
    // 3-body equations (PulleyEquation) have a bodyC — connect it too
    const eqAny = eq as any;
    if (eqAny.bodyC) {
      const nodeC = bodyToNode.get(eqAny.bodyC);
      if (nodeC) {
        if (nodeA && !nodeA.neighbors.includes(nodeC)) {
          nodeA.neighbors.push(nodeC);
          nodeC.neighbors.push(nodeA);
        }
        if (nodeB && !nodeB.neighbors.includes(nodeC)) {
          nodeB.neighbors.push(nodeC);
          nodeC.neighbors.push(nodeB);
        }
        nodeC.equations.push(eq);
      }
    }
  }

  // BFS to find connected components starting from dynamic bodies
  const islands: Island[] = [];
  const unvisited = new Set(dynamicNodes);

  while (unvisited.size > 0) {
    // Get any unvisited dynamic node
    const root = unvisited.values().next().value!;
    unvisited.delete(root);

    const islandBodies: Body[] = [];
    const islandEquations = new Set<Equation>();

    // BFS from root
    const queue: Node[] = [root];
    root.visited = true;

    while (queue.length > 0) {
      const node = queue.pop()!;
      islandBodies.push(node.body);
      for (const eq of node.equations) {
        islandEquations.add(eq);
      }

      // Visit unvisited dynamic neighbors
      for (const neighbor of node.neighbors) {
        if (!neighbor.visited && neighbor.body.motion === "dynamic") {
          neighbor.visited = true;
          unvisited.delete(neighbor);
          queue.push(neighbor);
        }
      }
    }

    islands.push({
      bodies: islandBodies,
      equations: [...islandEquations],
    });
  }

  return islands;
}
