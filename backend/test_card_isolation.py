import numpy as np
import cv2

def isolate_card_boundary(img_np: np.ndarray) -> np.ndarray:
    if img_np is None or img_np.size == 0:
        return img_np

    h, w = img_np.shape[:2]
    if h < 120 or w < 120:
        return img_np

    total_area = w * h

    try:
        gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY) if len(img_np.shape) == 3 else img_np
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        edged = cv2.Canny(blurred, 35, 125)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        closed = cv2.morphologyEx(edged, cv2.MORPH_CLOSE, kernel)

        contours, _ = cv2.findContours(closed, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        if not contours:
            return img_np

        sorted_cnts = sorted(contours, key=cv2.contourArea, reverse=True)

        for cnt in sorted_cnts[:5]:
            area = cv2.contourArea(cnt)
            if area < 0.12 * total_area:
                break
            if area > 0.98 * total_area:
                return img_np

            peri = cv2.arcLength(cnt, True)
            approx = cv2.approxPolyDP(cnt, 0.03 * peri, True)

            if len(approx) == 4 and cv2.isContourConvex(approx):
                pts = approx.reshape(4, 2)
                s = pts.sum(axis=1)
                diff = np.diff(pts, axis=1)
                tl = pts[np.argmin(s)]
                br = pts[np.argmax(s)]
                tr = pts[np.argmin(diff)]
                bl = pts[np.argmax(diff)]

                ordered_pts = np.array([tl, tr, br, bl], dtype="float32")

                width_a = np.linalg.norm(br - bl)
                width_b = np.linalg.norm(tr - tl)
                max_w = max(int(width_a), int(width_b))

                height_a = np.linalg.norm(tr - br)
                height_b = np.linalg.norm(tl - bl)
                max_h = max(int(height_a), int(height_b))

                if max_w > 100 and max_h > 100:
                    aspect = max_w / float(max_h)
                    if (1.15 <= aspect <= 2.3) or (0.45 <= aspect <= 0.85):
                        dst = np.array([
                            [0, 0],
                            [max_w - 1, 0],
                            [max_w - 1, max_h - 1],
                            [0, max_h - 1]
                        ], dtype="float32")
                        M = cv2.getPerspectiveTransform(ordered_pts, dst)
                        warped = cv2.warpPerspective(img_np, M, (max_w, max_h))
                        if warped is not None and warped.size > 0:
                            print(f"[CARD ISOLATION] Extracted 4-point perspective card crop ({max_w}x{max_h}), aspect: {aspect:.2f}")
                            return warped

            bx, by, bw, bh = cv2.boundingRect(cnt)
            b_area = bw * bh
            if 0.15 * total_area <= b_area <= 0.98 * total_area:
                b_aspect = bw / float(bh)
                if (1.15 <= b_aspect <= 2.3) or (0.45 <= b_aspect <= 0.85):
                    pad_x = int(bw * 0.015)
                    pad_y = int(bh * 0.015)
                    x1 = max(0, bx - pad_x)
                    y1 = max(0, by - pad_y)
                    x2 = min(w, bx + bw + pad_x)
                    y2 = min(h, by + bh + pad_y)
                    cropped = img_np[y1:y2, x1:x2]
                    if cropped is not None and cropped.size > 0:
                        print(f"[CARD ISOLATION] Extracted bounding rect card crop ({x2-x1}x{y2-y1}), aspect: {b_aspect:.2f}")
                        return cropped

    except Exception as e:
        print(f"[CARD ISOLATION] Warning during boundary isolation: {e}")

    return img_np

# Test 1: Full-frame card (no background)
full_img = np.ones((400, 650, 3), dtype=np.uint8) * 240
cv2.rectangle(full_img, (5, 5), (645, 395), (20, 20, 20), 2)
res1 = isolate_card_boundary(full_img)
print(f"Test 1 (Full frame): shape={res1.shape}")

# Test 2: Card on messy background (table / bedsheet)
bg_img = np.ones((800, 1000, 3), dtype=np.uint8) * 50 # dark desk
# Place card in the middle
cv2.rectangle(bg_img, (150, 200), (850, 650), (240, 240, 240), -1)
cv2.rectangle(bg_img, (150, 200), (850, 650), (0, 0, 0), 3)
res2 = isolate_card_boundary(bg_img)
print(f"Test 2 (Card on desk): shape={res2.shape}")

assert res2.shape[0] < 800 and res2.shape[1] < 1000, "Background should have been removed!"
print("Card isolation tests PASSED successfully!")
