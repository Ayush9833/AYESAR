import urllib.request
import json
import base64
import io
import qrcode
from PIL import Image, ImageDraw

# Create a QR code with authentic data: Name "ALICE SMITH", PAN "ABCDE1234F", DOB "01/01/1990"
qr_payload = json.dumps({
    "name": "ALICE SMITH",
    "pan": "ABCDE1234F",
    "dob": "01/01/1990"
})
qr_img = qrcode.make(qr_payload)
qr_buf = io.BytesIO()
qr_img.save(qr_buf, format='JPEG')
qr_b64 = 'data:image/jpeg;base64,' + base64.b64encode(qr_buf.getvalue()).decode()

# Create a physical card with forged printed name "BOB MARLEY" but the same PAN
card_img = Image.new('RGB', (600, 380), color=(255, 255, 255))
d = ImageDraw.Draw(card_img)
d.text((20, 20), 'INCOME TAX DEPARTMENT', fill=(0, 0, 0))
d.text((20, 50), 'ABCDE1234F', fill=(0, 0, 0))
d.text((20, 100), 'Name: BOB MARLEY', fill=(0, 0, 0))
d.text((20, 140), "Father's Name: ROBERT MARLEY", fill=(0, 0, 0))
d.text((20, 180), 'Date of Birth: 01/01/1990', fill=(0, 0, 0))

card_buf = io.BytesIO()
card_img.save(card_buf, format='JPEG')
card_b64 = 'data:image/jpeg;base64,' + base64.b64encode(card_buf.getvalue()).decode()

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/screen-traveler', data=json.dumps({
    'card_front_image': card_b64,
    'qr_code_image': qr_b64,
    'checkpoint_id': 'TEST_BOP',
    'officer_id': 'TEST_OFFICER',
    'border_corridor': 'UNIVERSAL'
}).encode(), headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req, timeout=45) as r:
    res = json.loads(r.read())
    print('TAMPER TEST RESULT:')
    print('Gate Decision:', res.get('gate_decision'))
    print('Tamper Status:', res.get('tamper_status'))
    print('Action Required:', res.get('action_required'))
    cross = res.get('detailed_steps', {}).get('ocr_cross_check', {})
    print('Cross Check:', json.dumps(cross, indent=2))
