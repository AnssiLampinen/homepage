function copyText(text, statusElement, message) {
  if (!text) {
    if (statusElement) statusElement.textContent = 'Nothing to copy yet.';
    return;
  }

  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    if (statusElement) statusElement.textContent = 'Clipboard access is unavailable in this browser.';
    return;
  }

  navigator.clipboard.writeText(text).then(() => {
    if (statusElement) statusElement.textContent = message;
  }).catch(() => {
    if (statusElement) statusElement.textContent = 'Copy failed in this browser.';
  });
}

async function copyCanvasImage(canvas, statusElement) {
  if (!canvas) {
    return;
  }

  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    if (statusElement) statusElement.textContent = 'Image copy is unavailable in this browser.';
    return;
  }

  canvas.toBlob(async blob => {
    if (!blob) {
      if (statusElement) statusElement.textContent = 'Could not read the generated image.';
      return;
    }

    try {
      await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
      if (statusElement) statusElement.textContent = 'QR image copied to clipboard.';
    } catch {
      if (statusElement) statusElement.textContent = 'Could not copy the QR image.';
    }
  }, 'image/png');
}

document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('qr-input');
  const sizeInput = document.getElementById('qr-size');
  const darkInput = document.getElementById('qr-dark');
  const lightInput = document.getElementById('qr-light');
  const canvas = document.querySelector('[data-qr-canvas]');
  const status = document.querySelector('[data-qr-status]');

  if (!input || !sizeInput || !darkInput || !lightInput || !canvas) {
    return;
  }

  if (typeof QRCode === 'undefined') {
    if (status) {
      status.textContent = 'QR code library failed to load.';
    }
    return;
  }

  const render = () => {
    const value = input.value.trim();

    if (!value) {
      const context = canvas.getContext('2d');
      context.clearRect(0, 0, canvas.width, canvas.height);
      if (status) {
        status.textContent = '';
      }
      return;
    }

    const size = Number(sizeInput.value);
    canvas.width = size;
    canvas.height = size;

    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: {
        dark: darkInput.value,
        light: lightInput.value,
      },
    }, error => {
      if (error) {
        if (status) {
          status.textContent = 'Could not generate the QR code.';
        }
        return;
      }

      if (status) {
        status.textContent = '';
      }
    });
  };

  document.querySelector('[data-qr-action="render"]').addEventListener('click', render);
  document.querySelector('[data-qr-action="download"]').addEventListener('click', () => {
    if (!input.value.trim()) {
      if (status) {
        status.textContent = 'Generate a QR code before downloading it.';
      }
      return;
    }

    const link = document.createElement('a');
    link.download = 'qr-code.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
    if (status) {
      status.textContent = '';
    }
  });

  document.querySelector('[data-qr-action="copy"]').addEventListener('click', () => {
    if (!input.value.trim()) {
      if (status) {
        status.textContent = 'Generate a QR code before copying it.';
      }
      return;
    }

    copyCanvasImage(canvas, status);
  });

  [input, sizeInput, darkInput, lightInput].forEach(element => {
    element.addEventListener('input', render);
  });

  render();
});