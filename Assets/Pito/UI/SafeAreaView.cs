using UnityEngine;

namespace Pito.UI
{
    public sealed class SafeAreaView : MonoBehaviour
    {
        private Rect last;
        private Vector2 size;
        private void Update()
        {
            var safe = Screen.safeArea;
            var current = new Vector2(Screen.width, Screen.height);
            if (safe == last && size == current) return;
            last = safe; size = current;
            if (current.x <= 0 || current.y <= 0) return;
            var rect = (RectTransform)transform;
            rect.anchorMin = safe.min / current;
            rect.anchorMax = safe.max / current;
            rect.offsetMin = rect.offsetMax = Vector2.zero;
        }
    }
}
