<script lang="ts">
	import { cn } from '$lib/utils/class-names';
	import { squareDimensions, type ComponentSize } from '$lib/utils/sizing';

	export let size: ComponentSize = 'md';
	export let colorscheme: 'light' | 'dark' = 'light';

	let className: string | undefined = undefined;
	export { className as class };
</script>

<svg
	class={cn(className)}
	height={squareDimensions[size] * 2.05}
	width={squareDimensions[size] * 2}
	viewBox="0 0 1026 1024"
	fill="none"
	xmlns="http://www.w3.org/2000/svg"
>
	<g clip-path="url(#clip0_101_3)">
		<path
			d="M573.236 655.5L505.736 478L440.736 655.5H573.236ZM491.736 442H519.236L648.736 779.5L621.236 785L581.236 677.5H433.236L395.236 782H368.236L491.736 442ZM730.264 782H702.764V442H730.264V782Z"
			fill="#93C5FD"
		/>
		<path
			d="M308.584 782H281.084V539.5H298.084L307.084 578C313.084 573 320.584 567.5 329.584 561.5C338.917 555.5 348.584 550.333 358.584 546C368.917 541.667 378.251 539.5 386.584 539.5L395.084 561C385.084 561 374.417 563.333 363.084 568C352.084 572.667 341.751 578.5 332.084 585.5C322.751 592.167 314.917 599 308.584 606V782Z"
			fill={colorscheme === 'light' ? '#FFFFFF' : '#334155'}
		/>
		<g clip-path="url(#clip1_101_3)">
			<path
				d="M523.427 467.064H488.844C486.456 467.064 484.521 465.171 484.521 462.834V292.805H426.594C424.206 292.805 422.271 290.912 422.271 288.576V254.739C422.271 252.403 424.206 250.51 426.594 250.51H484.521V193.833C484.521 191.497 486.456 189.604 488.844 189.604H523.427C525.815 189.604 527.75 191.497 527.75 193.833V250.51H585.677C588.065 250.51 589.999 252.403 589.999 254.739V288.576C589.999 290.912 588.065 292.805 585.677 292.805H527.75V462.834C527.75 465.171 525.815 467.064 523.427 467.064ZM493.167 458.605H519.104V288.576C519.104 286.239 521.039 284.346 523.427 284.346H581.354V258.969H523.427C521.039 258.969 519.104 257.076 519.104 254.739V198.063H493.167V254.739C493.167 257.076 491.232 258.969 488.844 258.969H430.917V284.346H488.844C491.232 284.346 493.167 286.239 493.167 288.576V458.605Z"
				fill="#93C5FD"
			/>
		</g>
	</g>
	<defs>
		<clipPath id="clip0_101_3">
			<rect width="532" height="645" fill="white" transform="translate(247 189)" />
		</clipPath>
		<clipPath id="clip1_101_3">
			<rect width="168" height="279" fill="white" transform="translate(422 189)" />
		</clipPath>
	</defs>
</svg>
