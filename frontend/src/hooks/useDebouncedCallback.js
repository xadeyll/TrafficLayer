import { useCallback, useRef } from "react";

export default function useDebouncedCallback(fn, delay = 400) {
	const t = useRef();
	return useCallback(
		(...args) => {
			clearTimeout(t.current);
			t.current = setTimeout(() => fn(...args), delay);
		},
		[fn, delay]
	);
}
