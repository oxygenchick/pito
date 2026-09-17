using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;

namespace Pito.UI
{
    public sealed class LongPressTrigger : MonoBehaviour, IPointerDownHandler, IPointerUpHandler, IPointerExitHandler
    {
        public float holdSeconds = 1.2f;
        public UnityEvent onLongPress = new UnityEvent();
        private bool held;
        private float elapsed;
        public void OnPointerDown(PointerEventData e) { held = true; elapsed = 0; }
        public void OnPointerUp(PointerEventData e) { held = false; }
        public void OnPointerExit(PointerEventData e) { held = false; }
        private void OnDisable() { held = false; }
        private void Update()
        {
            if (!held) return;
            elapsed += Time.unscaledDeltaTime;
            if (elapsed >= holdSeconds) { held = false; onLongPress.Invoke(); }
        }
    }
}
