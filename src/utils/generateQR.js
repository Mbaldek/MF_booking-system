import QRCode from 'qrcode';

/**
 * Generate a QR code data URL (base64 PNG) for delivery confirmation.
 * The encoded URL points to /staff/deliver/:orderId/:slotId
 */
export async function generateDeliveryQR(orderId, slotId) {
  const url = `${window.location.origin}/staff/deliver/${orderId}/${slotId}`;
  return QRCode.toDataURL(url, {
    width: 256,
    margin: 2,
    color: { dark: '#392D31', light: '#F0F0E6' },
  });
}
