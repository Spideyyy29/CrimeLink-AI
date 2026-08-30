import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";

function NetworkGraph() {
  const [graphData, setGraphData] = useState({
    nodes: [],
    links: []
  });

  const graphRef = useRef();

  useEffect(() => {
    fetch("http://127.0.0.1:8000/network")
      .then((response) => response.json())
      .then((data) => {
        setGraphData(data);
      })
      .catch((error) => {
        console.error("Network API error:", error);
      });
  }, []);

  const communityColors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2"
  ];

  return (
    <div className="network-container">

      <ForceGraph2D
        ref={graphRef}

        graphData={graphData}

        width={undefined}
        height={undefined}

        nodeVal={(node) => {
          const score = Number(node.leadScore) || 0;
          return 4 + score / 10;
        }}

        nodeCanvasObject={(node, ctx, globalScale) => {

          const label = node.name || node.id;
          const score = Number(node.leadScore) || 0;

          const radius = 4 + score / 10;

          const community =
            Number(node.community) || 0;

          const nodeColor =
            communityColors[
              community % communityColors.length
            ];

          // Node
          ctx.beginPath();
          ctx.arc(
            node.x,
            node.y,
            radius,
            0,
            2 * Math.PI
          );

          ctx.fillStyle = nodeColor;
          ctx.fill();

          // Highlight important leads
          if (score >= 50) {
            ctx.lineWidth = 2;
            ctx.strokeStyle = "#111827";
            ctx.stroke();
          }

          // Name
          const fontSize = Math.max(
            9,
            12 / globalScale
          );

          ctx.font = `bold ${fontSize}px Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#111827";

          ctx.fillText(
            label,
            node.x,
            node.y + radius + 5 / globalScale
          );
        }}

        linkLabel={(link) =>
          link.type || "CONNECTED"
        }

        linkDirectionalArrowLength={4}
        linkDirectionalArrowRelPos={1}

        enableZoomInteraction={false}

        enablePanInteraction={false}

        cooldownTicks={100}
  
        d3VelocityDecay={0.35}

        onNodeClick={(node) => {
          console.log(
            "Selected person:",
            node
          );
        }}
      />

    </div>
  );
}

export default NetworkGraph;