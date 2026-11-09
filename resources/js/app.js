
document.querySelectorAll('[data-confirm]').forEach(form => {
    form.addEventListener('submit', event => {
        if (!window.confirm(form.dataset.confirm)) event.preventDefault();
    });
});
document.querySelectorAll('[data-print]').forEach(button => button.addEventListener('click', () => window.print()));

function clearVisibleResult() {
    const result = document.getElementById('result');
    if (result) {
        result.hidden = true;
        document.getElementById('result-changed')?.classList.remove('hidden');
    }
}
document.querySelectorAll('[data-analysis-input]').forEach(input => input.addEventListener('input', clearVisibleResult));
document.querySelector('[data-camera]')?.addEventListener('click', () => document.getElementById('camera-photo').click());
document.getElementById('camera-photo')?.addEventListener('change', event => {
    const photo = document.getElementById('photo');
    photo.files = event.target.files;
    photo.dispatchEvent(new Event('change'));
});
document.querySelector('[data-photo-preview]')?.addEventListener('change', event => {
    const file = event.target.files[0];
    if (!file) return;
    const preview = document.getElementById('photo-preview-image');
    if (preview.dataset.objectUrl) URL.revokeObjectURL(preview.dataset.objectUrl);
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.dataset.objectUrl = url;
    document.getElementById('photo-preview').classList.remove('hidden');
    clearVisibleResult();
});
document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', event => {
        const button = event.submitter;
        if (button?.dataset.busyLabel) {
            button.setAttribute('aria-busy', 'true');
            button.textContent = button.dataset.busyLabel;
            // Do not disable before submission: named submit controls must be sent.
            setTimeout(() => { button.disabled = true; }, 0);
        }
    });
});
