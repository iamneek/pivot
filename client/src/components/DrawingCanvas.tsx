import { useEffect, useRef, useState } from "react"
import "../App.css"

const DrawingCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null | undefined>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);
    type Point = { x: number; y: number };
    type Stroke = { points: Point[]; color: string; width: number };

    const strokesRef = useRef<Stroke[]>([]);
    const currentStrokeRef = useRef<Stroke | null>(null);
    const wsRef = useRef<WebSocket>(null);

    const resizeCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        const context = canvas.getContext("2d");
        if (!context) return;
        context.scale(scale, scale);
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.lineWidth = 5;
        context.strokeStyle = '#000000';
        contextRef.current = context;
        redrawAll(rect.width, rect.height);
    };

    const redrawAll = (cssWidth: number, cssHeight: number) => {
        const context = contextRef.current;
        if (!context) return;
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, cssWidth, cssHeight);
        for (const stroke of strokesRef.current) {
            if (stroke.points.length < 2) continue;
            context.strokeStyle = stroke.color;
            context.lineWidth = stroke.width;
            context.beginPath();
            context.moveTo(stroke.points[0].x, stroke.points[0].y);
            for (let i = 1; i < stroke.points.length; i++) {
                context.lineTo(stroke.points[i].x, stroke.points[i].y);
            }
            context.stroke();
        }
    };



    useEffect(() => {
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        return () => {
            window.removeEventListener('resize', resizeCanvas);
        }
    }, []);

    useEffect(() => {
        const ws = new WebSocket("ws://127.0.0.1:8000/ws")
        wsRef.current = ws
        ws.onopen = () => {
            console.log("Connected to ws");
        }

        ws.onmessage = (event) => {
            const msg = JSON.parse(event.data)
            console.log("Received from server: ", msg)
            if (msg.Action === "Draw") {
                strokesRef.current.push(msg.DataPoints)
            } else if (msg.Action === "Clear") {
                localClear()
            }
            if (canvasRef.current) {
                const rect = canvasRef.current.getBoundingClientRect();
                redrawAll(rect.width, rect.height);
            }
        }

        ws.onerror = (err) => {
            console.log("Error: ", err)
        }
        ws.onclose = () => {
            console.log("Connection closed")
        }
        return () => ws.close()
    }, []);

    const startDrawing = (e: React.PointerEvent<HTMLCanvasElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        const { offsetX, offsetY } = e.nativeEvent;
        currentStrokeRef.current = { points: [{ x: offsetX, y: offsetY }], color: '#000000', width: 5 };
        if (contextRef.current) {
            contextRef.current.beginPath();
            contextRef.current.moveTo(offsetX, offsetY);
        }
        setIsDrawing(true);
    };

    const stopDrawing = () => {
        if (currentStrokeRef.current) {
            strokesRef.current.push(currentStrokeRef.current);
            wsRef.current?.send(JSON.stringify({ "Action": "Draw", "DataPoints": currentStrokeRef.current }))
            // console.log(JSON.stringify(currentStrokeRef.current))
            currentStrokeRef.current = null;
        }
        setIsDrawing(false);
    };

    const Draw = (e: React.PointerEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !currentStrokeRef.current) return;
        const { offsetX, offsetY } = e.nativeEvent;
        currentStrokeRef.current.points.push({ x: offsetX, y: offsetY });
        if (contextRef.current) {
            contextRef.current.lineTo(offsetX, offsetY);
            contextRef.current.stroke();
        }
    };

    const localClear = () => {
        strokesRef.current = [];
        const canvas = canvasRef.current;
        if (canvas) {
            const rect = canvas.getBoundingClientRect();
            redrawAll(rect.width, rect.height);
        }
    };

    const clearCanvas = () => {
        wsRef.current?.send(JSON.stringify({ "Action": "Clear" }))
        localClear();
    };

    const DrawPoints = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        if (contextRef.current) {
            contextRef.current.beginPath();
            contextRef.current.fillStyle = "#000000";
            contextRef.current.arc(offsetX, offsetY, 2, 0, Math.PI * 2);
            contextRef.current.fill();
        }
    }

    return (
        <div className="canvas__container ">
            <button className="canvas__clear_btn !px-4 !py-2 bg-red-400 z-10 cursor-pointer rounded-sm !mt-4 absolute right-4 hover:bg-red-500" onClick={clearCanvas}>Clear Canvas</button>
            <canvas ref={canvasRef} style={{ width: "100%", height: "100vh", display: "block", cursor: "crosshair" }} onPointerDown={startDrawing} onPointerMove={Draw} onPointerUp={stopDrawing} onClick={DrawPoints}></canvas>
        </div>
    )
}

export default DrawingCanvas