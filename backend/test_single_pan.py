import urllib.request
import json
import base64
import io
from PIL import Image, ImageDraw

img = Image.new('RGB', (600, 380), color=(255, 255, 255))
d = ImageDraw.Draw(img)
d.text((20, 20), 'INCOME TAX DEPARTMENT', fill=(0, 0, 0))
d.text((20, 40), 'GOVT. OF INDIA', fill=(0, 0, 0))
d.text((20, 70), 'Permanent Account Number Card', fill=(0, 0, 0))
d.text((20, 110), 'USMPS9511J', fill=(0, 0, 0))
d.text((20, 140), 'Name: SHIKHA', fill=(0, 0, 0))
d.text((20, 170), "Father's Name: RAVINDRA SINGH", fill=(0, 0, 0))
d.text((20, 200), 'Date of Birth: 09/11/2006', fill=(0, 0, 0))

buf = io.BytesIO()
img.save(buf, format='JPEG')
b64 = 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode()

req = urllib.request.Request('http://127.0.0.1:8000/api/v1/screen-traveler', data=json.dumps({
    'card_front_image': b64,
    'checkpoint_id': 'TEST_BOP',
    'officer_id': 'TEST_OFFICER',
    'border_corridor': 'UNIVERSAL'
}).encode(), headers={'Content-Type': 'application/json'})

with urllib.request.urlopen(req, timeout=15) as r:
    res = json.loads(r.read())
    print('SUCCESS:')
    print('Gate Decision:', res.get('gate_decision'))
    print('Identity:', json.dumps(res.get('extracted_identity'), indent=2))
