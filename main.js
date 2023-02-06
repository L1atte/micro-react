import { Didact } from "./micro-react/index.js";
const { createElement, render, useState } = Didact;

// function App(props) {
// 	return createElement("h1", null, "Hi", props.name);
// }

function Counter() {
	const [state, setState] = useState(1);

	return createElement("h1", { onclick: () => setState(prev => prev + 1) }, state);
}

const element = createElement(Counter, {
	name: "foo",
});
const container = document.getElementById("root");
render(element, container);
