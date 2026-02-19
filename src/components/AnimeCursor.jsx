import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import "./AnimeCursor.css";

const CURSOR_CONFIG = {
    default: { img: "/assets/cursor/NormalCursor.gif", x: 1, y: 1 },
    pointer: { img: "/assets/cursor/LinkCursor.gif",   x: 4, y: 1 },
    text:    { img: "/assets/cursor/TextCursor.gif",   x: 3, y: 9 }
};

const POINTER_SELECTORS = [
    "button",
    "a",
    ".clickable",
    '[role="button"]'
];
const TEXT_SELECTORS = [
    "input",
    "textarea"
];

function getCursorType(target) {
    if (!target) return "default";
    if (target.closest(TEXT_SELECTORS.join(","))) return "text";
    if (target.closest(POINTER_SELECTORS.join(","))) return "pointer";
    return "default";
}

const AnimeCursor = () => {
    const [cursorType, setCursorType] = useState("default");
    const [visible, setVisible] = useState(true);
    const [mountNode, setMountNode] = useState(() => document.body);
    const cursorRef = useRef(null);

    useEffect(() => {
        let lastType = "default";
        const moveHandler = (e) => {
            const { x, y } = CURSOR_CONFIG[cursorType];
            if (cursorRef.current) {
                cursorRef.current.style.transform = `translate3d(${e.clientX - x}px, ${e.clientY - y}px, 0)`;
            }
        };

        const overHandler = (e) => {
            const type = getCursorType(e.target);
            if (type !== lastType) {
                setCursorType(type);
                lastType = type;
            }
        };

        const fullscreenHandler = () => {
            if (document.fullscreenElement) {
                setMountNode(document.fullscreenElement);
            } else {
                setMountNode(document.body);
            }
            setVisible(true);
            if (cursorRef.current) {
                cursorRef.current.style.display = "block";
            }
        };

        window.addEventListener("mousemove", moveHandler, { passive: true });
        window.addEventListener("mouseover", overHandler, { passive: true });
        document.addEventListener("fullscreenchange", fullscreenHandler);

        document.body.style.cursor = "none";

        return () => {
            window.removeEventListener("mousemove", moveHandler);
            window.removeEventListener("mouseover", overHandler);
            document.removeEventListener("fullscreenchange", fullscreenHandler);
            document.body.style.cursor = "";
        };
    }, [cursorType]);

    const cursorImg = (
        <img
            ref={cursorRef}
            src={CURSOR_CONFIG[cursorType].img}
            alt=""
            className={`anime-cursor ${!visible ? 'anime-cursor-hidden' : ''}`}
            draggable={false}
        />
    );

    return createPortal(cursorImg, mountNode);
};

export default AnimeCursor;
