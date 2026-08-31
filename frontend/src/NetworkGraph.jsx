import { useEffect, useRef, useState } from "react";
import ForceGraph2D from "react-force-graph-2d";
import { forceLink, forceManyBody } from "d3-force-3d";

function NetworkGraph() {
  const [graphData, setGraphData] = useState({ nodes: [], links: [] });
  const graphRef = useRef();

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/network`)
      .then((response) => response.json())
      .then((data) => {
        setGraphData(data);
      })
      .catch((error) => {
        console.error("Network API error:", error);
      });
  }, []);

  // Center and scale graph automatically once simulation engine stops
  const handleEngineStop = () => {
    if (graphRef.current) {
      graphRef.current.zoomToFit(400, 50); // 400ms duration, 50px padding
    }
  };

  // Configure custom D3 forces to push nodes apart and increase link lengths
  useEffect(() => {
    if (graphRef.current) {
      // 1. Increase link distance between connected nodes
      graphRef.current.d3Force("link", forceLink().distance(120));

      // 2. Stronger charge repulsion so nodes spread out efficiently
      graphRef.current.d3Force("charge", forceManyBody().strength(-300));

      // 3. Re-heat simulation to apply new forces
      graphRef.current.d3ReheatSimulation();
    }
  }, [graphData]);

  const communityColors = [
    "#2563eb",
    "#dc2626",
    "#16a34a",
    "#9333ea",
    "#ea580c",
    "#0891b2",
  ];

  return (
    <div
      className="network-container"
      style={{ width: "100%", height: "600px", position: "relative" }}
    >
      <ForceGraph2D
        ref={graphRef}
        graphData={graphData}
        
        // Auto-fit to parent container dimensions
        width={undefined}
        height={undefined}

        // Auto-center configuration
        onEngineStop={handleEngineStop}
        enableZoomInteraction={true}
        enablePanInteraction={true}

        nodeVal={(node) => {
          const score = Number(node.leadScore) || 0;
          return 6 + score / 10;
        }}

        nodeCanvasObject={(node, ctx, globalScale) => {
          const label = node.name || node.id;
          const score = Number(node.leadScore) || 0;
          const radius = 6 + score / 10;
          const community = Number(node.community) || 0;
          const nodeColor =
            communityColors[community % communityColors.length];

          // Node circle
          ctx.beginPath();
          ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
          ctx.fillStyle = nodeColor;
          ctx.fill();

          // Highlight key leads
          if (score >= 50) {
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = "#dc2626";
            ctx.stroke();
          }

          // Label styling
          const fontSize = Math.max(10, 12 / globalScale);
          ctx.font = `600 ${fontSize}px Inter, Arial`;
          ctx.textAlign = "center";
          ctx.textBaseline = "top";
          ctx.fillStyle = "#1e293b";

          ctx.fillText(
            label,
            node.x,
            node.y + radius + 4 / globalScale
          );
        }}

        linkLabel={(link) => link.type || "CONNECTED"}
        linkDirectionalArrowLength={6}
        linkDirectionalArrowRelPos={0.9}
        linkWidth={1.5}
        
        cooldownTicks={150}
        d3VelocityDecay={0.3}

        onNodeClick={(node) => {
          console.log("Selected person:", node);
          // Center camera view smoothly on clicked node
          if (graphRef.current) {
            graphRef.current.centerAt(node.x, node.y, 1000);
            graphRef.current.zoom(2.5, 1000);
          }
        }}
      />
    </div>
  );
}

export default NetworkGraph;