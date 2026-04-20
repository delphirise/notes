pdfjsLib.GlobalWorkerOptions.workerSrc = '../vendor/pdf.worker-legacy.min.js';
    const usePdfWorker = false;
    const pdfAssetConfig = {
        cMapUrl: '../vendor/cmaps/',
        cMapPacked: true,
        standardFontDataUrl: '../vendor/standard_font_data/',
        useWorkerFetch: false
    };

        const { PDFDocument, StandardFonts, rgb, ParseSpeeds } = PDFLib;
        const SIGNATURE_STORAGE_KEY = 'pdfEditorSavedSignature';

        const state = {
            pdfBytes: null,
            pdfJsDoc: null,
            pageMeta: [],
            overlays: [],
            selectedOverlayId: null,
            activePage: 1,
            activeTool: 'signature',
            signatureDataUrl: '',
            dragState: null
        };

        const ui = {
            pdfUpload: document.getElementById('pdfUpload'),
            signatureUpload: document.getElementById('signatureUpload'),
            signaturePreview: document.getElementById('signaturePreview'),
            saveSignatureMemory: document.getElementById('saveSignatureMemory'),
            clearSignatureMemory: document.getElementById('clearSignatureMemory'),
            signatureStatus: document.getElementById('signatureStatus'),
            fileStatus: document.getElementById('fileStatus'),
            exportPdf: document.getElementById('exportPdf'),
            pdfStage: document.getElementById('pdfStage'),
            toolHelp: document.getElementById('toolHelp'),
            overlayList: document.getElementById('overlayList'),
            overlayText: document.getElementById('overlayText'),
            fontSize: document.getElementById('fontSize'),
            textColor: document.getElementById('textColor'),
            overlayWidth: document.getElementById('overlayWidth'),
            overlayHeight: document.getElementById('overlayHeight'),
            overlayOpacity: document.getElementById('overlayOpacity'),
            deleteOverlay: document.getElementById('deleteOverlay'),
            toolButtons: Array.from(document.querySelectorAll('[data-tool]'))
        };

        const toolDescriptions = {
            text: 'Click a page to add a text box. Edit the text in the left panel.',
            signature: 'Click a page to place your signature image.',
            whiteout: 'Click a page to create a white out block for covering content.'
        };

        function clamp(value, min, max) {
            return Math.min(Math.max(value, min), max);
        }

        function escapeHtml(value) {
            return String(value)
                .replaceAll('&', '&amp;')
                .replaceAll('<', '&lt;')
                .replaceAll('>', '&gt;')
                .replaceAll('"', '&quot;')
                .replaceAll("'", '&#39;');
        }

        function getOverlayById(id) {
            return state.overlays.find((overlay) => overlay.id === id) || null;
        }

        function getPageMeta(pageNumber) {
            return state.pageMeta.find((page) => page.pageNumber === pageNumber) || null;
        }

        function setSignatureUiState() {
            const hasSignature = Boolean(state.signatureDataUrl);
            const hasSavedSignature = Boolean(localStorage.getItem(SIGNATURE_STORAGE_KEY));

            if (hasSignature) {
                ui.signaturePreview.src = state.signatureDataUrl;
                ui.signaturePreview.classList.remove('hidden');
            } else {
                ui.signaturePreview.removeAttribute('src');
                ui.signaturePreview.classList.add('hidden');
            }

            ui.saveSignatureMemory.disabled = !hasSignature;
            ui.clearSignatureMemory.disabled = !hasSavedSignature;
            ui.signatureStatus.textContent = hasSavedSignature
                ? 'Saved signature is available for future visits.'
                : 'No signature saved in browser memory.';
        }

        async function loadSavedSignature() {
            const savedSignature = localStorage.getItem(SIGNATURE_STORAGE_KEY);
            if (!savedSignature) {
                setSignatureUiState();
                return;
            }

            state.signatureDataUrl = await normalizeSignatureDataUrl(savedSignature);
            if (state.signatureDataUrl !== savedSignature) {
                localStorage.setItem(SIGNATURE_STORAGE_KEY, state.signatureDataUrl);
            }
            setSignatureUiState();
        }

        function saveSignatureToMemory() {
            if (!state.signatureDataUrl) {
                alert('Upload a signature image first.');
                return;
            }

            localStorage.setItem(SIGNATURE_STORAGE_KEY, state.signatureDataUrl);
            setSignatureUiState();
        }

        function clearSavedSignature() {
            localStorage.removeItem(SIGNATURE_STORAGE_KEY);
            state.signatureDataUrl = '';
            ui.signatureUpload.value = '';
            setSignatureUiState();
        }

        function setActiveTool(tool) {
            state.activeTool = tool;
            ui.toolHelp.textContent = toolDescriptions[tool];
            ui.toolButtons.forEach((button) => {
                button.classList.toggle('active', button.dataset.tool === tool);
            });
        }

        function setSelectedOverlay(id) {
            state.selectedOverlayId = id;
            state.overlays.forEach((overlay) => {
                const element = document.getElementById(overlay.id);
                if (element) {
                    element.classList.toggle('selected', overlay.id === id);
                }
            });
            syncControlPanel();
            renderOverlayList();
        }

        function selectPage(pageNumber) {
            state.activePage = pageNumber;
            document.querySelectorAll('.page-frame').forEach((frame) => {
                frame.classList.toggle('selected', Number(frame.dataset.pageNumber) === pageNumber);
            });
            document.querySelectorAll('.page-shell').forEach((shell) => {
                shell.classList.toggle('active', Number(shell.dataset.pageNumber) === pageNumber);
            });
        }

        function createOverlayId() {
            return `overlay-${Date.now()}-${Math.random().toString(16).slice(2)}`;
        }

        function makeOverlayDefaults(type, pageNumber, x, y) {
            if (type === 'signature') {
                return {
                    id: createOverlayId(),
                    type,
                    pageNumber,
                    x,
                    y,
                    width: 180,
                    height: 72,
                    opacity: 1,
                    imageDataUrl: state.signatureDataUrl
                };
            }

            if (type === 'whiteout') {
                return {
                    id: createOverlayId(),
                    type,
                    pageNumber,
                    x,
                    y,
                    width: 160,
                    height: 36,
                    opacity: 1
                };
            }

            return {
                id: createOverlayId(),
                type: 'text',
                pageNumber,
                x,
                y,
                width: 220,
                height: 46,
                opacity: 1,
                text: 'Edit me',
                fontSize: 18,
                color: '#111827'
            };
        }

        function normalizeOverlayBounds(overlay) {
            const pageMeta = getPageMeta(overlay.pageNumber);
            if (!pageMeta) {
                return;
            }
            overlay.width = clamp(overlay.width, 20, pageMeta.displayWidth);
            overlay.height = clamp(overlay.height, 20, pageMeta.displayHeight);
            overlay.x = clamp(overlay.x, 0, pageMeta.displayWidth - overlay.width);
            overlay.y = clamp(overlay.y, 0, pageMeta.displayHeight - overlay.height);
        }

        function overlayMarkup(overlay) {
            if (overlay.type === 'signature') {
                return `<img src="${overlay.imageDataUrl}" alt="Signature overlay"><div class="resize-handle" data-action="resize"></div>`;
            }
            if (overlay.type === 'whiteout') {
                return '<div class="resize-handle" data-action="resize"></div>';
            }
            return `${escapeHtml(overlay.text).replaceAll('\n', '<br>')}<div class="resize-handle" data-action="resize"></div>`;
        }

        function updateOverlayElement(overlay) {
            const element = document.getElementById(overlay.id);
            if (!element) {
                return;
            }

            normalizeOverlayBounds(overlay);
            element.style.left = `${overlay.x}px`;
            element.style.top = `${overlay.y}px`;
            element.style.width = `${overlay.width}px`;
            element.style.height = `${overlay.height}px`;
            element.style.opacity = `${overlay.opacity}`;

            if (overlay.type === 'text') {
                element.style.fontSize = `${overlay.fontSize}px`;
                element.style.color = overlay.color;
            }

            element.innerHTML = overlayMarkup(overlay);
            element.classList.toggle('selected', overlay.id === state.selectedOverlayId);
        }

        function renderOverlay(overlay) {
            const pageFrame = document.querySelector(`.page-frame[data-page-number="${overlay.pageNumber}"]`);
            if (!pageFrame) {
                return;
            }

            const element = document.createElement('div');
            element.id = overlay.id;
            element.className = `overlay overlay-${overlay.type}`;
            element.dataset.overlayId = overlay.id;
            pageFrame.appendChild(element);
            updateOverlayElement(overlay);
        }

        function renderOverlayList() {
            if (!state.overlays.length) {
                ui.overlayList.innerHTML = '<p class="muted-note text-xs">No edits yet</p>';
                return;
            }

            ui.overlayList.innerHTML = state.overlays
                .slice()
                .sort((a, b) => a.pageNumber - b.pageNumber)
                .map((overlay, index) => {
                    const icon = overlay.type === 'text' ? '[T]' : overlay.type === 'signature' ? '[S]' : '[W]';
                    const label = overlay.type === 'text'
                        ? overlay.text.slice(0, 20) || 'Text'
                        : overlay.type === 'signature' ? 'Signature' : 'Whitebox';
                    const activeClass = overlay.id === state.selectedOverlayId ? 'ring-2 ring-sky-400 bg-sky-100 border-sky-400' : '';
                    return `
                        <button type="button" class="overlay-row ${activeClass} w-full px-3 py-2.5 text-left text-xs transition-all" data-overlay-list-id="${overlay.id}">
                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2 flex-1 min-w-0">
                                    <span class="text-lg">${icon}</span>
                                    <span class="font-semibold text-slate-900 truncate">${escapeHtml(label)}</span>
                                </div>
                                <span class="rounded-full bg-slate-200 px-1.5 py-0.5 text-[10px] font-bold text-slate-700 flex-shrink-0">P${overlay.pageNumber}</span>
                            </div>
                        </button>
                    `;
                })
                .join('');

            document.querySelectorAll('[data-overlay-list-id]').forEach((button) => {
                button.addEventListener('click', () => {
                    const overlay = getOverlayById(button.dataset.overlayListId);
                    if (!overlay) {
                        return;
                    }
                    selectPage(overlay.pageNumber);
                    setSelectedOverlay(overlay.id);
                });
            });
        }

        function syncControlPanel() {
            const overlay = getOverlayById(state.selectedOverlayId);
            const isText = overlay?.type === 'text';

            ui.deleteOverlay.disabled = !overlay;
            ui.overlayText.disabled = !isText;
            ui.fontSize.disabled = !isText;
            ui.textColor.disabled = !isText;
            ui.overlayWidth.disabled = !overlay;
            ui.overlayHeight.disabled = !overlay;
            ui.overlayOpacity.disabled = !overlay;

            ui.overlayText.value = isText ? overlay.text : '';
            ui.fontSize.value = isText ? String(overlay.fontSize) : '';
            ui.textColor.value = isText ? overlay.color : '#111827';
            ui.overlayWidth.value = overlay ? String(Math.round(overlay.width)) : '';
            ui.overlayHeight.value = overlay ? String(Math.round(overlay.height)) : '';
            ui.overlayOpacity.value = overlay ? String(overlay.opacity) : '1';
        }

        function readFileAsDataUrl(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = () => reject(reader.error || new Error('Could not read file.'));
                reader.readAsDataURL(file);
            });
        }

        function loadImageElement(src) {
            return new Promise((resolve, reject) => {
                const image = new Image();
                image.onload = () => resolve(image);
                image.onerror = () => reject(new Error('Could not decode image.'));
                image.src = src;
            });
        }

        async function convertImageDataUrlToPng(dataUrl) {
            if (!dataUrl || dataUrl.startsWith('data:image/png')) {
                return dataUrl;
            }

            const image = await loadImageElement(dataUrl);
            const canvas = document.createElement('canvas');
            canvas.width = image.naturalWidth || image.width;
            canvas.height = image.naturalHeight || image.height;

            const context = canvas.getContext('2d');
            if (!context) {
                throw new Error('Could not prepare image conversion canvas.');
            }

            context.drawImage(image, 0, 0);
            return canvas.toDataURL('image/png');
        }

        async function normalizeSignatureDataUrl(dataUrl) {
            if (!dataUrl) {
                return '';
            }

            if (
                dataUrl.startsWith('data:image/png')
                || dataUrl.startsWith('data:image/jpeg')
                || dataUrl.startsWith('data:image/jpg')
            ) {
                return dataUrl;
            }

            return convertImageDataUrlToPng(dataUrl);
        }

        async function embedImageDataUrl(pdfDoc, dataUrl) {
            if (dataUrl.startsWith('data:image/png')) {
                return pdfDoc.embedPng(dataUrl);
            }

            if (dataUrl.startsWith('data:image/jpeg') || dataUrl.startsWith('data:image/jpg')) {
                return pdfDoc.embedJpg(dataUrl);
            }

            return pdfDoc.embedPng(await convertImageDataUrlToPng(dataUrl));
        }

        function fitWithinBox(contentWidth, contentHeight, boxWidth, boxHeight) {
            const contentAspect = contentWidth / contentHeight;
            const boxAspect = boxWidth / boxHeight;

            if (contentAspect > boxAspect) {
                const width = boxWidth;
                const height = width / contentAspect;
                return {
                    width,
                    height,
                    offsetX: 0,
                    offsetY: (boxHeight - height) / 2
                };
            }

            const height = boxHeight;
            const width = height * contentAspect;
            return {
                width,
                height,
                offsetX: (boxWidth - width) / 2,
                offsetY: 0
            };
        }

        async function loadPdf(file) {
            const arrayBuffer = await file.arrayBuffer();
            state.pdfBytes = new Uint8Array(arrayBuffer.slice(0));
            const renderBytes = new Uint8Array(arrayBuffer.slice(0));
            state.pdfJsDoc = await pdfjsLib.getDocument({
                data: renderBytes,
                disableWorker: !usePdfWorker,
                cMapUrl: pdfAssetConfig.cMapUrl,
                cMapPacked: pdfAssetConfig.cMapPacked,
                standardFontDataUrl: pdfAssetConfig.standardFontDataUrl,
                wasmUrl: pdfAssetConfig.wasmUrl,
                useWorkerFetch: pdfAssetConfig.useWorkerFetch
            }).promise;
            state.pageMeta = [];
            state.overlays = [];
            state.selectedOverlayId = null;
            state.activePage = 1;

            ui.fileStatus.textContent = `${file.name} loaded. ${state.pdfJsDoc.numPages} page${state.pdfJsDoc.numPages === 1 ? '' : 's'}.`;
            await renderPdfPages();
            renderOverlayList();
            syncControlPanel();
        }

        async function renderPdfPages() {
            ui.pdfStage.innerHTML = '';

            for (let pageNumber = 1; pageNumber <= state.pdfJsDoc.numPages; pageNumber += 1) {
                const page = await state.pdfJsDoc.getPage(pageNumber);
                const viewport = page.getViewport({ scale: 1.2 });
                const shell = document.createElement('div');
                shell.className = 'page-shell';
                shell.dataset.pageNumber = String(pageNumber);

                const label = document.createElement('div');
                label.className = 'page-label';
                label.textContent = `Page ${pageNumber}`;

                const frame = document.createElement('div');
                frame.className = 'page-frame';
                frame.dataset.pageNumber = String(pageNumber);
                frame.style.width = `${viewport.width}px`;
                frame.style.height = `${viewport.height}px`;

                const canvas = document.createElement('canvas');
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);
                frame.appendChild(canvas);
                shell.appendChild(label);
                shell.appendChild(frame);
                ui.pdfStage.appendChild(shell);

                const context = canvas.getContext('2d');
                await page.render({ canvasContext: context, viewport }).promise;

                state.pageMeta.push({
                    pageNumber,
                    widthPdf: page.view[2],
                    heightPdf: page.view[3],
                    displayWidth: viewport.width,
                    displayHeight: viewport.height
                });

                frame.addEventListener('click', (event) => {
                    if (event.target.closest('.overlay')) {
                        return;
                    }
                    selectPage(pageNumber);
                    addOverlayFromClick(frame, pageNumber, event);
                });
            }

            selectPage(1);
        }

        function addOverlayFromClick(frame, pageNumber, event) {
            if (!state.pdfJsDoc) {
                return;
            }

            if (state.activeTool === 'signature' && !state.signatureDataUrl) {
                alert('Upload a signature image first.');
                return;
            }

            const rect = frame.getBoundingClientRect();
            const rawX = event.clientX - rect.left;
            const rawY = event.clientY - rect.top;
            const overlay = makeOverlayDefaults(state.activeTool, pageNumber, rawX - 20, rawY - 20);

            normalizeOverlayBounds(overlay);
            state.overlays.push(overlay);
            renderOverlay(overlay);
            setSelectedOverlay(overlay.id);
        }

        function removeSelectedOverlay() {
            if (!state.selectedOverlayId) {
                return;
            }
            state.overlays = state.overlays.filter((overlay) => overlay.id !== state.selectedOverlayId);
            document.getElementById(state.selectedOverlayId)?.remove();
            state.selectedOverlayId = null;
            renderOverlayList();
            syncControlPanel();
        }

        function applyControlUpdates() {
            const overlay = getOverlayById(state.selectedOverlayId);
            if (!overlay) {
                return;
            }

            if (overlay.type === 'text') {
                overlay.text = ui.overlayText.value;
                overlay.fontSize = clamp(Number(ui.fontSize.value) || overlay.fontSize, 8, 96);
                overlay.color = ui.textColor.value || overlay.color;
            }

            overlay.width = clamp(Number(ui.overlayWidth.value) || overlay.width, 20, 2000);
            overlay.height = clamp(Number(ui.overlayHeight.value) || overlay.height, 20, 2000);
            overlay.opacity = clamp(Number(ui.overlayOpacity.value) || overlay.opacity, 0.1, 1);

            updateOverlayElement(overlay);
            syncControlPanel();
            renderOverlayList();
        }

        function beginDrag(event) {
            const overlayElement = event.target.closest('.overlay');
            if (!overlayElement) {
                return;
            }

            event.preventDefault();
            event.stopPropagation();

            const overlay = getOverlayById(overlayElement.dataset.overlayId);
            if (!overlay) {
                return;
            }

            selectPage(overlay.pageNumber);
            setSelectedOverlay(overlay.id);

            const pageFrame = overlayElement.parentElement;
            const pageRect = pageFrame.getBoundingClientRect();
            const overlayRect = overlayElement.getBoundingClientRect();
            const resizing = Boolean(event.target.closest('[data-action="resize"]'));

            state.dragState = {
                overlayId: overlay.id,
                pageRect,
                mode: resizing ? 'resize' : 'move',
                startClientX: event.clientX,
                startClientY: event.clientY,
                startWidth: overlay.width,
                startHeight: overlay.height,
                offsetX: event.clientX - overlayRect.left,
                offsetY: event.clientY - overlayRect.top
            };
        }

        function handlePointerMove(event) {
            if (!state.dragState) {
                return;
            }

            const overlay = getOverlayById(state.dragState.overlayId);
            if (!overlay) {
                return;
            }

            const pageMeta = getPageMeta(overlay.pageNumber);
            if (!pageMeta) {
                return;
            }

            if (state.dragState.mode === 'move') {
                const x = event.clientX - state.dragState.pageRect.left - state.dragState.offsetX;
                const y = event.clientY - state.dragState.pageRect.top - state.dragState.offsetY;
                overlay.x = clamp(x, 0, pageMeta.displayWidth - overlay.width);
                overlay.y = clamp(y, 0, pageMeta.displayHeight - overlay.height);
            } else {
                const deltaX = event.clientX - state.dragState.startClientX;
                const deltaY = event.clientY - state.dragState.startClientY;
                overlay.width = clamp(state.dragState.startWidth + deltaX, 20, pageMeta.displayWidth - overlay.x);
                overlay.height = clamp(state.dragState.startHeight + deltaY, 20, pageMeta.displayHeight - overlay.y);
            }

            updateOverlayElement(overlay);
            syncControlPanel();
        }

        function endDrag() {
            if (!state.dragState) {
                return;
            }
            state.dragState = null;
            renderOverlayList();
        }

        function hexToRgbColor(hex) {
            const normalized = hex.replace('#', '');
            const bigint = parseInt(normalized, 16);
            return rgb(
                ((bigint >> 16) & 255) / 255,
                ((bigint >> 8) & 255) / 255,
                (bigint & 255) / 255
            );
        }

        function downloadPdfBytes(bytes, filename) {
            const blob = new Blob([bytes], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            link.click();
            URL.revokeObjectURL(url);
        }

        function getRenderedPageCanvas(pageNumber) {
            return document.querySelector(`.page-frame[data-page-number="${pageNumber}"] canvas`);
        }

        async function drawOverlaysOnPdf(pdfDoc) {
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
            const imageCache = new Map();

            for (const overlay of state.overlays) {
                const page = pdfDoc.getPage(overlay.pageNumber - 1);
                const pageMeta = getPageMeta(overlay.pageNumber);
                if (!pageMeta) {
                    continue;
                }

                const scaleX = page.getWidth() / pageMeta.displayWidth;
                const scaleY = page.getHeight() / pageMeta.displayHeight;
                const pdfX = overlay.x * scaleX;
                const pdfWidth = overlay.width * scaleX;
                const pdfHeight = overlay.height * scaleY;
                const pdfY = page.getHeight() - ((overlay.y + overlay.height) * scaleY);

                if (overlay.type === 'whiteout') {
                    page.drawRectangle({
                        x: pdfX,
                        y: pdfY,
                        width: pdfWidth,
                        height: pdfHeight,
                        color: rgb(1, 1, 1),
                        opacity: overlay.opacity
                    });
                    continue;
                }

                if (overlay.type === 'signature') {
                    let imageEntry = imageCache.get(overlay.imageDataUrl);
                    if (!imageEntry) {
                        const image = await embedImageDataUrl(pdfDoc, overlay.imageDataUrl);
                        const imageElement = await loadImageElement(overlay.imageDataUrl);
                        imageEntry = {
                            image,
                            width: imageElement.naturalWidth || imageElement.width,
                            height: imageElement.naturalHeight || imageElement.height
                        };
                        imageCache.set(overlay.imageDataUrl, imageEntry);
                    }

                    const fitted = fitWithinBox(
                        imageEntry.width,
                        imageEntry.height,
                        pdfWidth,
                        pdfHeight
                    );

                    page.drawImage(imageEntry.image, {
                        x: pdfX + fitted.offsetX,
                        y: pdfY + fitted.offsetY,
                        width: fitted.width,
                        height: fitted.height,
                        opacity: overlay.opacity
                    });
                    continue;
                }

                const size = overlay.fontSize * scaleY;
                const lineHeight = size * 1.15;
                const maxWidth = Math.max(pdfWidth - (12 * scaleX), 10);
                const lines = overlay.text.split('\n');
                const startY = page.getHeight() - (overlay.y * scaleY) - size;

                lines.forEach((line, index) => {
                    page.drawText(line, {
                        x: pdfX + (6 * scaleX),
                        y: startY - (index * lineHeight),
                        size,
                        font,
                        color: hexToRgbColor(overlay.color),
                        opacity: overlay.opacity,
                        maxWidth
                    });
                });
            }
        }

        async function exportPdfFromRenderedPages() {
            if (!state.pageMeta.length) {
                throw new Error('No rendered pages available for fallback export.');
            }

            const pdfDoc = await PDFDocument.create();

            for (const pageMeta of state.pageMeta) {
                const canvas = getRenderedPageCanvas(pageMeta.pageNumber);
                if (!canvas) {
                    throw new Error(`Missing rendered canvas for page ${pageMeta.pageNumber}.`);
                }

                const page = pdfDoc.addPage([pageMeta.widthPdf, pageMeta.heightPdf]);
                const pageImage = await pdfDoc.embedPng(canvas.toDataURL('image/png'));
                page.drawImage(pageImage, {
                    x: 0,
                    y: 0,
                    width: page.getWidth(),
                    height: page.getHeight()
                });
            }

            await drawOverlaysOnPdf(pdfDoc);
            return pdfDoc.save();
        }

        async function exportPdf() {
            if (!state.pdfBytes) {
                alert('Load a PDF first.');
                return;
            }

            ui.exportPdf.disabled = true;
            const originalText = ui.exportPdf.innerHTML;
            ui.exportPdf.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"></path></svg><span>Processing...</span>';

            try {
                const pdfDoc = await PDFDocument.load(state.pdfBytes, {
                    ignoreEncryption: true,
                    parseSpeed: ParseSpeeds.Fastest,
                    throwOnInvalidObject: false
                });
                await drawOverlaysOnPdf(pdfDoc);
                const bytes = await pdfDoc.save();
                downloadPdfBytes(bytes, 'edited-document.pdf');
            } catch (error) {
                console.error('Primary PDF export failed, falling back to rendered-page export.', error);

                try {
                    const bytes = await exportPdfFromRenderedPages();
                    downloadPdfBytes(bytes, 'edited-document.pdf');
                    alert('The original PDF structure could not be edited directly, so the exported file was rebuilt from the rendered pages.');
                } catch (fallbackError) {
                    console.error(fallbackError);
                    alert(`Failed to export PDF: ${fallbackError.message}`);
                }
            } finally {
                ui.exportPdf.disabled = false;
                ui.exportPdf.innerHTML = originalText;
            }
        }

        ui.toolButtons.forEach((button) => {
            button.addEventListener('click', () => setActiveTool(button.dataset.tool));
        });

        ui.pdfUpload.addEventListener('change', async (event) => {
            const [file] = event.target.files || [];
            if (!file) {
                return;
            }
            try {
                await loadPdf(file);
            } catch (error) {
                console.error(error);
                alert(`Failed to load PDF: ${error.message}`);
            }
        });

        ui.signatureUpload.addEventListener('change', async (event) => {
            const [file] = event.target.files || [];
            if (!file) {
                return;
            }
            try {
                state.signatureDataUrl = await normalizeSignatureDataUrl(await readFileAsDataUrl(file));
                setSignatureUiState();
            } catch (error) {
                console.error(error);
                alert(`Failed to load signature image: ${error.message}`);
            }
        });

        ui.saveSignatureMemory.addEventListener('click', saveSignatureToMemory);
        ui.clearSignatureMemory.addEventListener('click', clearSavedSignature);
        ui.overlayText.addEventListener('input', applyControlUpdates);
        ui.fontSize.addEventListener('input', applyControlUpdates);
        ui.textColor.addEventListener('input', applyControlUpdates);
        ui.overlayWidth.addEventListener('input', applyControlUpdates);
        ui.overlayHeight.addEventListener('input', applyControlUpdates);
        ui.overlayOpacity.addEventListener('input', applyControlUpdates);
        ui.deleteOverlay.addEventListener('click', removeSelectedOverlay);
        ui.exportPdf.addEventListener('click', exportPdf);

        document.addEventListener('mousedown', beginDrag);
        document.addEventListener('mousemove', handlePointerMove);
        document.addEventListener('mouseup', endDrag);

        document.addEventListener('click', (event) => {
            const overlayElement = event.target.closest('.overlay');
            if (overlayElement) {
                const overlay = getOverlayById(overlayElement.dataset.overlayId);
                if (overlay) {
                    selectPage(overlay.pageNumber);
                    setSelectedOverlay(overlay.id);
                }
                return;
            }

            if (!event.target.closest('.panel-card') && !event.target.closest('.page-frame')) {
                setSelectedOverlay(null);
            }
        });

        syncControlPanel();
        setActiveTool('signature');
        loadSavedSignature();
