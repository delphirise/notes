import './styles/main.css';
import { createShell } from './app/shell.js';

createShell(document.querySelector('#app'));

function disablePredictiveText(root = document) {
	const selector = 'input[type="text"], input[type="email"], input[type="search"], input[type="tel"], input[type="url"], input[type="number"], input[type="date"], input[type="time"], textarea';
	root.querySelectorAll(selector).forEach((element) => {
		element.setAttribute('autocomplete', 'off');
		element.setAttribute('autocorrect', 'off');
		element.setAttribute('autocapitalize', 'none');
		element.setAttribute('spellcheck', 'false');
	});
}

disablePredictiveText();
const observer = new MutationObserver(() => disablePredictiveText());
observer.observe(document.body, { childList: true, subtree: true });
