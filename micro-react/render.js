function createDom(fiber) {
	// 创建父节点
	const dom = fiber.type == "TEXT_ELEMENT" ? document.createTextNode("") : document.createElement(fiber.type);

	// 赋值属性
	Object.keys(fiber.props)
		.filter(key => key !== "children")
		.forEach(key => (dom[key] = fiber.props[key]));

	return dom;
}

// 渲染 Root
// Commit Phase
function commitRoot() {
	commitWork(wipRoot.child);
	wipRoot = null;
}

function commitWork(fiber) {
	if (!fiber) {
		return;
	}
	const domParent = fiber.parent.dom;
	domParent.appendChild(fiber.dom);
	commitWork(fiber.child);
	commitWork(fiber.sibling);
}

// 开始渲染
function render(element, container) {
	// 追踪 root 节点的 fiber tree，称之为 work in progress
	wipRoot = {
		dom: container,
		props: {
			children: [element],
		},
		child: null,
	};
	// set next unit of work
	nextUnitOfWork = wipRoot;
}

let wipRoot = null;
let nextUnitOfWork = null;

// 调度函数
function workLoop(deadline) {
	// 是否退出
	let shouldYield = false;

	while (nextUnitOfWork && !shouldYield) {
		nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
		shouldYield = deadline.timeRemaining() < 1;
	}

	// 如果没有 nextUnitOfWork ，则进入 Commit 阶段
	if (!nextUnitOfWork && wipRoot) {
		commitRoot();
	}

	// 没有剩余时间，退出循环。将工作交给 requestIdleCallback 调度
	requestIdleCallback(workLoop);
}

// 第一次请求
requestIdleCallback(workLoop);

function performUnitOfWork(fiber) {
	// add dom node
	if (!fiber.dom) fiber.dom = createDom(fiber);

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
