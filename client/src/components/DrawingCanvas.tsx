import { useEffect, useRef, useState } from "react"
import "../App.css"

const DrawingCanvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null | undefined>(null);
    const [isDrawing, setIsDrawing] = useState<boolean>(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scale = window.devicePixelRatio || 1;
        canvas.width = rect.width * scale;
        canvas.height = rect.height * scale;
        const context = canvas?.getContext("2d");
        if (context && canvas) {
            context.scale(scale, scale);
            context.lineCap = 'round';
            context.lineJoin = 'round';
            context.lineWidth = 5;
            context.strokeStyle = '#000000';
            context.fillStyle = '#ffffff'
            context.fillRect(0, 0, rect.width, rect.height);
        }
        contextRef.current = context;
    }, [])

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const { offsetX, offsetY } = e.nativeEvent;
        if (contextRef.current) {
            contextRef.current.beginPath();
            contextRef.current.moveTo(offsetX, offsetY);
            setIsDrawing(true);
        }

    }

    const stopDrawing = () => {
        contextRef.current?.closePath()
        setIsDrawing(false);
    }

    const Draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDrawing) {
            const { offsetX, offsetY } = e.nativeEvent;
            if (contextRef.current) {
                contextRef.current.lineTo(offsetX, offsetY);
                contextRef.current.stroke();
            }
        }
    }

    const clearCanvas = () => {
        if (contextRef.current && canvasRef.current) {
            contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    }

    return (
        <div className="canvas__container ">
            <button className="canvas__clear_btn !px-4 !py-2 bg-red-400 z-10 cursor-pointer rounded-sm !mt-4 absolute right-4 hover:bg-red-500" onClick={clearCanvas}>Clear Canvas</button>
            <canvas height={800} width={800} ref={canvasRef} style={{ width: "100%", height: "100vh", display: "block", cursor: "crosshair" }} onMouseDown={startDrawing} onMouseMove={Draw} onMouseUp={stopDrawing} ></canvas>
        </div>
    )
}

export default DrawingCanvas