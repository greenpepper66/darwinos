# -*- coding:utf-8 -*-
# Extract facial features
import numpy as np
import cv2
import os
from PIL import Image

def get_distance(pt1, pt2):
    assert len(pt1) == 2 and len(pt2) == 2, "Assert pt1 and pt2 to be point"
    return np.math.sqrt(np.power(pt1[0]-pt2[0], 2) + np.power(pt1[1]-pt2[1], 2))


def get_eye_aspect_ratio(pt1, pt2,pt3,pt4,pt5,pt6):
    """
    pt1---> landmark point 37
    pt2---> landmark point 38
    pt3---> landmark point 39
    pt4---> landmark point 40
    pt5---> landmark point 41
    pt6---> landmark point 42
    """
    return (get_distance(pt2, pt6)+get_distance(pt3, pt5))/(2 * get_distance(pt1, pt4))


def get_mouth_aspect_ratio_over_eye(pt1,pt2,pt3,pt4):
    """
    pt1---> landmark point 52
    pt2---> landmark point 58
    pt3---> landmark point 49
    pt4---> landmark point 55
    """
    return get_distance(pt1, pt2) / get_distance(pt3, pt4)


def get_puc(pt1, pt2,pt3,pt4,pt5,pt6):
    """
    pt1---> landmark point 37
    pt2---> landmark point 38
    pt3---> landmark point 39
    pt4---> landmark point 40
    pt5---> landmark point 41
    pt6---> landmark point 42
    same map for landmark point as func `get_eye_aspect_ratio`
    """
    area = np.power(get_distance(pt2, pt5)/2, 2) * np.math.pi
    perimeter = get_distance(pt1, pt2) + get_distance(pt2, pt3) +get_distance(pt3, pt4) +get_distance(pt4, pt5) + get_distance(pt5, pt6) + get_distance(pt6, pt1)
    circularity = 4*np.math.pi*area/np.power(perimeter, 2)
    return circularity


def get_moe(mar, ear):
    return mar/ear


def extract_facial_features(face_cascade, landmark_detector,img_file):
    if type(img_file) == np.ndarray:
        img = img_file
    else:
        try:
            img = Image.open(img_file)
        except FileNotFoundError as e:
            exit(1)
    img = np.array(img, dtype='uint8')
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    cv2.equalizeHist(img_gray, img_gray)

    faces = face_cascade.detectMultiScale(img_gray, 1.1, 3)
    print("Detect {} faces".format(len(faces)))
    face_x, face_y, face_w, face_h = 0, 0, 0, 0
    if len(faces) == 0:
        print("No face detected!")
        return [None]*5
    # select detect face area with max size
    max_detect_area=-1
    detect_face_idx=0
    idx=0
    for x, y, w, h in faces:
        # if w*h >= np.shape(img_gray)[0]*np.shape(img_gray)[1]*0.12 and w*h > max_detect_area:
        if w*h > max_detect_area:
            max_detect_area = w*h
            detect_face_idx = idx
        idx +=1

        # img = cv2.rectangle(img, (x, y), (x+w, y+h), (0, 255, 0), 2)
        # face_x, face_y, face_w, face_h = x, y, w, h
    
    if max_detect_area == -1:
        print("No face detected!!!")
        return [None]*5

    face_x, face_y, face_w, face_h = faces[detect_face_idx]
    img = cv2.rectangle(img, (face_x, face_y), (face_x+face_w, face_y+face_h), (0,255,0), 2)

    # get face locations and cut it out
    # face_img = img_gray[face_y:face_y+face_h, face_x:face_x+face_w]

    # get facial landmark
    _, landmarks = landmark_detector.fit(img_gray, faces[detect_face_idx:detect_face_idx+1])

    ldmk_pts=[]
    features = []
    for ldmk in landmarks:
        for x, y in ldmk[0]:
            ldmk_pts.append([x,y])
            cv2.circle(img, (x,y), 1, (0,255,0), 1)

    print("len of landmark points={}".format(len(ldmk_pts)))
    # cv2.imwrite(os.path.join(os.path.dirname(img_file), os.path.basename(img_file)[:-4]+"_2_.png"), img)
    feat_eye_aspect = get_eye_aspect_ratio(ldmk_pts[36], ldmk_pts[37], ldmk_pts[38], ldmk_pts[39], ldmk_pts[40], ldmk_pts[41])
    feat_mouth_aspect = get_mouth_aspect_ratio_over_eye(ldmk_pts[51], ldmk_pts[57], ldmk_pts[48], ldmk_pts[54])
    feat_puc = get_puc(ldmk_pts[36], ldmk_pts[37], ldmk_pts[38], ldmk_pts[39], ldmk_pts[40], ldmk_pts[41])
    feat_moe = get_moe(feat_mouth_aspect, feat_eye_aspect)

    print("feats={},{},{},{}".format(feat_eye_aspect, feat_mouth_aspect, feat_puc, feat_moe))
    return feat_eye_aspect, feat_mouth_aspect, feat_puc, feat_moe, img