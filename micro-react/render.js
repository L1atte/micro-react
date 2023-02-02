export function createDom(fiber) {
	// 创建父节点
	const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

	// 赋值属性
	Object.keys(fiber.props)
		.filter(key => key !== "children")
		.forEach(key => (dom[key] = fiber.props[key]));

	return dom;
}

function render(element, container) {
	// set next unit of work
	nextUnitOfWork = {
		dom: container,
		props: {
			children: [element],
		},
	};
}

let nextUnitOfWork = null;

// 调度函数
function workLoop(deadline) {
	// 是否退出
	let shouldYield = false;

	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() < 1;
	}

	// 没有剩余时间，退出循环。将工作交给 requestIdleCallback 调度
	requestIdleCallback(workLoop);
}

// 第一次请求
requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
	// add dom node
	if (!fiber.dom) fiber.dom = createDom(fiber);

	if (fiber.parent) fiber.parent.dom.appendChild(fiber.dom);

	// create new fibers
	const elements = fiber.props.children;
	let prevSibling = null;

	for (let index = 0; index < elements.length; index++) {
		const element = elements[index];

		const newFiber = {
			type: element.type,
			props: element.props,
			parent: fiber,
			dom: null,
		};

		if (index === 0) {
			fiber.child = newFiber;
		} else {
			prevSibling.sibling = newFiber;
		}

		prevSibling = newFiber;
	}

	if (fiber.child) {
		return fiber.child;
	}
	let nextFiber = fiber;
	while (nextFiber) {
		if (nextFiber.sibling) {
			return nextFiber.sibling;
		}
		nextFiber = nextFiber.parent;
	}
}

export { render };
