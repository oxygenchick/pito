using System;
using UnityEngine;
using UnityEngine.EventSystems;

namespace Pito.Tutorial
{
    // Actual raycast shield: passes only the highlighted target to the same EventSystem.
    public sealed class TutorialOverlay : MonoBehaviour, ICanvasRaycastFilter, IPointerClickHandler
    {
        public RectTransform allowedUi;
        public Collider2D allowedPet;
        public Camera worldCamera;
        public bool blockAll;
        public event Action BackgroundTapped;
        public bool IsRaycastLocationValid(Vector2 point, Camera eventCamera)
        {
            if (blockAll) return true;
            if (allowedUi != null && RectTransformUtility.RectangleContainsScreenPoint(allowedUi, point, eventCamera)) return false;
            if (allowedPet != null && worldCamera != null)
            {
                Vector3 world = worldCamera.ScreenToWorldPoint(new Vector3(point.x, point.y, -worldCamera.transform.position.z));
                if (allowedPet.OverlapPoint(world)) return false;
            }
            return true;
        }
        public void OnPointerClick(PointerEventData e) => BackgroundTapped?.Invoke();
    }
}
