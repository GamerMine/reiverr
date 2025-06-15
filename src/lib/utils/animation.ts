export function animateBackground(mainDiv: HTMLDivElement) {
	let bubbleDiv = document.createElement('div');

	const bubbleSize = 180;
	const start = getRandomEdgePoint(bubbleSize);
	let endEdge = '';
	switch (start.edge) {
		case 'top':
			endEdge = 'bottom';
			break;
		case 'bottom':
			endEdge = 'top';
			break;
		case 'left':
			endEdge = 'right';
			break;
		case 'right':
			endEdge = 'left';
			break;
	}
	let end = getRandomEdgePoint(bubbleSize, endEdge);

	while (start.x === end.x && start.y === end.y && start.edge === end.edge) {
		end = getRandomEdgePoint(bubbleSize);
	}

	bubbleDiv.className = `absolute -z-10 overflow-hidden top-0 left-0 w-180 h-180 bg-gradient-to-r from-blue-800 via-purple-900 to-red-900 rounded-full blur-3xl`;
	const distance = getDistance(start, end);
	const speed = 40;
	const duration = (distance / speed) * 1000;
	const animation = bubbleDiv.animate(
		[
			{
				transform: `translate(${start.x}px, ${start.y}px)`,
				opacity: 0
			},
			{
				transform: `translate(${lerp(start.x, end.x, 0.3)}px, ${lerp(start.y, end.y, 0.3)}px)`,
				opacity: 0.6
			},
			{
				transform: `translate(${lerp(start.x, end.x, 0.7)}px, ${lerp(start.y, end.y, 0.7)}px)`,
				opacity: 0.6
			},
			{
				transform: `translate(${end.x}px, ${end.y}px)`,
				opacity: 0
			}
		],
		{
			duration: duration,
			iterations: 1,
			easing: 'linear'
		}
	);

	mainDiv.appendChild(bubbleDiv);

	animation.onfinish = () => {
		mainDiv.removeChild(bubbleDiv);
		animateBackground(mainDiv);
	};
}

function randomInt(min: number, max: number) {
	return Math.floor(Math.random() * (max - min) + min);
}

function getRandomEdgePoint(
	bubbleSize: number,
	cEdge: string | undefined = undefined
): {
	x: number;
	y: number;
	edge: string;
} {
	let edge: string;
	if (cEdge) {
		edge = cEdge;
	} else {
		edge = ['top', 'bottom', 'left', 'right'][randomInt(0, 4)];
	}
	switch (edge) {
		case 'top':
			return {
				x: randomInt(0 - bubbleSize, window.innerWidth + bubbleSize),
				y: 0 - bubbleSize,
				edge
			};
		case 'bottom':
			return {
				x: randomInt(0 - bubbleSize, window.innerWidth + bubbleSize),
				y: window.innerHeight + bubbleSize,
				edge
			};
		case 'left':
			return {
				x: -bubbleSize,
				y: randomInt(0 - bubbleSize, window.innerHeight + bubbleSize),
				edge
			};
		case 'right':
			return {
				x: window.innerWidth + bubbleSize,
				y: randomInt(0 - bubbleSize, window.innerHeight + bubbleSize),
				edge
			};
		default:
			return { x: 0, y: 0, edge };
	}
}

function lerp(start: number, end: number, t: number): number {
	return start + (end - start) * t;
}

function getDistance(a: { x: number; y: number }, b: { x: number; y: number }) {
	const dx = b.x - a.x;
	const dy = b.y - a.y;
	return Math.sqrt(dx * dx + dy * dy);
}
