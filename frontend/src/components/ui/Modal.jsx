import { useEffect, useRef } from "react";
import "./modal.css";

export default function Modal({
	title,
	onClose,
	children,
	footer,
	initialFocusRef,
}) {
	const dialogRef = useRef(null);

	useEffect(() => {
		const prev = document.activeElement;
		const el =
			(initialFocusRef && initialFocusRef.current) ||
			(dialogRef.current &&
				dialogRef.current.querySelector(
					"button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
				));
		if (el && typeof el.focus === "function") el.focus();
		return () => {
			if (prev && typeof prev.focus === "function") prev.focus();
		};
	}, [initialFocusRef]);

	useEffect(() => {
		const onKey = (e) => e.key === "Escape" && onClose?.();
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [onClose]);

	useEffect(() => {
		const trap = (e) => {
			if (!dialogRef.current) return;
			const focusables = dialogRef.current.querySelectorAll(
				"button, [href], input, textarea, select, [tabindex]:not([tabindex='-1'])"
			);
			if (!focusables.length) return;
			const first = focusables[0];
			const last = focusables[focusables.length - 1];
			if (e.key === "Tab") {
				if (e.shiftKey && document.activeElement === first) {
					last.focus();
					e.preventDefault();
				} else if (!e.shiftKey && document.activeElement === last) {
					first.focus();
					e.preventDefault();
				}
			}
		};
		document.addEventListener("keydown", trap);
		return () => document.removeEventListener("keydown", trap);
	}, []);

	return (
		<div className="modal-backdrop" role="presentation" onClick={onClose}>
			<div
				className="modal"
				role="dialog"
				aria-modal="true"
				aria-labelledby="modal-title"
				onClick={(e) => e.stopPropagation()}
				ref={dialogRef}
			>
				<div className="modal-head">
					<h3 id="modal-title">{title}</h3>
					<button
						className="icon-btn close"
						aria-label="Закрити"
						onClick={onClose}
					>
						✖
					</button>
				</div>
				<div className="modal-body scrollable">{children}</div>
				<div className="modal-foot">{footer}</div>
			</div>
		</div>
	);
}
