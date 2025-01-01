"use client";
import { useEffect, useRef, useState } from "react";

interface Dot {
  x: number;
  y: number;
}

interface Rectangle {
  x: number;
  y: number;
  rotation: number;
  isValid: boolean;
}

const inchToPixels = (inch: number) => {
  return inch * 50;
};

const mmToPixels = (mm: number) => {
  return (mm * 50) / 25.4;
};

const getRectangleCorners = (
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number
) => {
  const corners = [
    { x: -width / 2, y: -height / 2 },
    { x: width / 2, y: -height / 2 },
    { x: width / 2, y: height / 2 },
    { x: -width / 2, y: height / 2 },
  ];

  return corners.map((corner) => ({
    x: x + (corner.x * Math.cos(rotation) - corner.y * Math.sin(rotation)),
    y: y + (corner.x * Math.sin(rotation) + corner.y * Math.cos(rotation)),
  }));
};

const isPointInCircle = (
  px: number,
  py: number,
  cx: number,
  cy: number,
  r: number
) => {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= r * r;
};

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gateway, setGateway] = useState<Dot | null>(null);
  const [ambushCenter, setAmbushCenter] = useState<Dot | null>(null);
  const [rectangle, setRectangle] = useState<Rectangle | null>(null);
  const [isPlacingAmbushCenter, setIsPlacingAmbushCenter] = useState(false);
  const [isPlacingRectangle, setIsPlacingRectangle] = useState(false);
  const [helperText, setHelperText] = useState("Click to place gateway marker");

  // Update helper text when states change
  useEffect(() => {
    if (gateway) {
      if (isPlacingAmbushCenter) {
        setHelperText("Select the ambush center point");
      } else if (isPlacingRectangle) {
        setHelperText("Place the ambushing unit of Knights, scroll to rotate");
      }
    } else {
      setHelperText("Click to place gateway marker");
    }
  }, [gateway, isPlacingAmbushCenter, isPlacingRectangle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const container = canvas.parentElement;
      if (!container) return;

      canvas.width = container.clientWidth;
      canvas.height = container.clientHeight;

      // Redraw everything after resize
      if (gateway) {
        drawGateway(ctx, gateway.x, gateway.y);
      }
      if (ambushCenter) {
        drawAmbushCircle(ctx, ambushCenter.x, ambushCenter.y);
      }
      if (rectangle) {
        drawRectangle(
          ctx,
          rectangle.x,
          rectangle.y,
          rectangle.rotation,
          rectangle.isValid
        );
      }
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    return () => window.removeEventListener("resize", resizeCanvas);
  }, [gateway, ambushCenter, rectangle]);

  const drawGateway = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
    // Draw gateway center
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "purple";
    ctx.fill();

    // Draw gateway 1.5" radius
    ctx.beginPath();
    ctx.arc(x, y, inchToPixels(1.5), 0, Math.PI * 2);
    ctx.strokeStyle = "purple";
    ctx.stroke();

    // Draw dotted radius line
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(x, y);
    ctx.lineTo(x + inchToPixels(1.5), y);
    ctx.strokeStyle = "purple";
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Add measurement text
    ctx.font = "14px Arial";
    ctx.fillStyle = "purple";
    ctx.textAlign = "center";
    ctx.fillText('1.5"', x + inchToPixels(0.75), y - 10);
  };

  const drawAmbushCircle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number
  ) => {
    // Draw ambush center
    ctx.beginPath();
    ctx.arc(x, y, 3, 0, Math.PI * 2);
    ctx.fillStyle = "teal";
    ctx.fill();

    // Draw ambush circle
    ctx.beginPath();
    ctx.arc(x, y, inchToPixels(6), 0, Math.PI * 2);
    ctx.strokeStyle = "teal";
    ctx.stroke();

    // Draw dotted radius line
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(x, y);
    ctx.lineTo(x + inchToPixels(6), y);
    ctx.strokeStyle = "teal";
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Add measurement text
    ctx.font = "14px Arial";
    ctx.fillStyle = "teal";
    ctx.textAlign = "center";
    ctx.fillText('6"', x + inchToPixels(3), y - 10);
  };

  const drawRectangle = (
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    rotation: number,
    isValid: boolean
  ) => {
    const width = mmToPixels(5 * 25);
    const height = mmToPixels(2 * 25);

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // Draw rectangle
    ctx.beginPath();
    ctx.rect(-width / 2, -height / 2, width, height);
    ctx.strokeStyle = isValid ? "green" : "red";
    ctx.stroke();

    // Draw internal lines for each 25mm
    ctx.beginPath();
    for (let i = 1; i < 5; i++) {
      const x = -width / 2 + i * mmToPixels(25);
      ctx.moveTo(x, -height / 2);
      ctx.lineTo(x, height / 2);
    }
    ctx.strokeStyle = isValid ? "green" : "red";
    ctx.stroke();

    // Draw triangle at bottom, pointing outward
    ctx.beginPath();
    ctx.moveTo(-mmToPixels(5), height / 2); // Left point on rectangle edge
    ctx.lineTo(0, height / 2 + mmToPixels(5)); // Center point outside rectangle
    ctx.lineTo(mmToPixels(5), height / 2); // Right point on rectangle edge
    ctx.fillStyle = isValid ? "green" : "red";
    ctx.fill();

    ctx.restore();
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    if (isPlacingAmbushCenter && gateway) {
      // Calculate distance from gateway to mouse
      const dx = mouseX - gateway.x;
      const dy = mouseY - gateway.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      // Gateway radius is 1.5 inches
      const maxDistance = inchToPixels(1.5);

      let x = mouseX;
      let y = mouseY;

      // If mouse is outside gateway radius, constrain the point
      if (distance > maxDistance) {
        const angle = Math.atan2(dy, dx);
        x = gateway.x + Math.cos(angle) * maxDistance;
        y = gateway.y + Math.sin(angle) * maxDistance;
      }

      setAmbushCenter({ x, y });
    } else if (isPlacingRectangle && ambushCenter) {
      const width = mmToPixels(5 * 25);
      const height = mmToPixels(2 * 25);
      const rotation = rectangle
        ? rectangle.rotation
        : Math.random() * Math.PI * 2;

      const corners = getRectangleCorners(
        mouseX,
        mouseY,
        width,
        height,
        rotation
      );
      const circleRadius = inchToPixels(6);

      // Count corners outside the circle
      const cornersOutside = corners.filter(
        (corner) =>
          !isPointInCircle(
            corner.x,
            corner.y,
            ambushCenter.x,
            ambushCenter.y,
            circleRadius
          )
      ).length;

      const isValid = cornersOutside <= 1;
      setRectangle({ x: mouseX, y: mouseY, rotation, isValid });
    }

    // Clear and redraw everything
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gateway) drawGateway(ctx, gateway.x, gateway.y);
    if (ambushCenter) drawAmbushCircle(ctx, ambushCenter.x, ambushCenter.y);
    if (rectangle) {
      drawRectangle(ctx, mouseX, mouseY, rectangle.rotation, rectangle.isValid);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (e.button === 0) {
      if (gateway === null) {
        // Place gateway
        setGateway({ x, y });
        setIsPlacingAmbushCenter(true);
      } else if (isPlacingAmbushCenter) {
        // Place ambush center
        setIsPlacingAmbushCenter(false);
        setIsPlacingRectangle(true);
      } else if (isPlacingRectangle) {
        // Finalize rectangle placement
      }
    } else if (e.button === 2) {
      // Right click - reset everything
      setGateway(null);
      setAmbushCenter(null);
      setRectangle(null);
      setIsPlacingAmbushCenter(false);
      setIsPlacingRectangle(false);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gateway) drawGateway(ctx, gateway.x, gateway.y);
    if (ambushCenter) drawAmbushCircle(ctx, ambushCenter.x, ambushCenter.y);
    if (rectangle)
      drawRectangle(
        ctx,
        rectangle.x,
        rectangle.y,
        rectangle.rotation,
        rectangle.isValid
      );
  };

  // Add wheel event handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    if (!isPlacingRectangle || !rectangle) return;

    // Adjust rotation based on wheel direction
    // Smaller delta for finer control
    const rotationDelta = (e.deltaY > 0 ? 1 : -1) * (Math.PI / 32);

    // Check if any corner of the rectangle is within 6" of ambush center
    const corners = getRectangleCorners(
      rectangle.x,
      rectangle.y,
      mmToPixels(5 * 25),
      mmToPixels(2 * 25),
      rectangle.rotation + rotationDelta
    );

    const isValid =
      corners.filter(
        (corner) =>
          ambushCenter &&
          !isPointInCircle(
            corner.x,
            corner.y,
            ambushCenter.x,
            ambushCenter.y,
            inchToPixels(6)
          )
      ).length <= 1;

    setRectangle({
      ...rectangle,
      rotation: rectangle.rotation + rotationDelta,
      isValid,
    });

    // Redraw
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (gateway) drawGateway(ctx, gateway.x, gateway.y);
    if (ambushCenter) drawAmbushCircle(ctx, ambushCenter.x, ambushCenter.y);
    drawRectangle(
      ctx,
      rectangle.x,
      rectangle.y,
      rectangle.rotation + rotationDelta,
      rectangle.isValid
    );
  };

  return (
    <div className="h-screen p-6">
      <h1 className="text-2xl font-bold mb-6 text-center">Hellmaw Helper</h1>
      <div className="flex flex-col gap-4">
        <div className="text-center font-medium text-lg">{helperText}</div>
        <div className="w-full h-[calc(100vh-160px)] bg-gray-100 dark:bg-gray-800 rounded-lg">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            onClick={handleClick}
            onMouseMove={handleMouseMove}
            onWheel={handleWheel}
            onContextMenu={(e) => {
              e.preventDefault();
              handleClick(e);
            }}
          />
        </div>
      </div>
    </div>
  );
}
