import { Didact } from "./micro-react/index.js";
const { createElement, render } = Didact;

const handleChange = e => {
	renderer(e.target.value);
};

const container = document.querySelector("#root");

const renderer = value => {
	const element = createElement(
		"div",
		null,
		createElement("input", {
			value: value,
			oninput: e => {
				handleChange(e);
			},
		}),
		createElement("h2", null, value),
	);

	render(element, container);
};

renderer("Hello");
