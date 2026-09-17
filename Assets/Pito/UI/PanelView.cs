using UnityEngine;

namespace Pito.UI
{
    [RequireComponent(typeof(CanvasGroup))]
    public sealed class PanelView : MonoBehaviour
    {
        public TransitionProfile transition;
        public bool initiallyVisible;
        public bool IsVisible { get; private set; }
        private CanvasGroup group;
        private RectTransform rect;
        private Vector2 origin;
        private float progress;

        private void Awake()
        {
            group = GetComponent<CanvasGroup>(); rect = (RectTransform)transform;
            origin = rect.anchoredPosition;
            SetVisible(initiallyVisible, true);
        }
        public void Show() => SetVisible(true);
        public void Hide() => SetVisible(false);
        public void Toggle() => SetVisible(!IsVisible);
        public void SetVisible(bool visible, bool immediate = false)
        {
            if (group == null) Awake();
            IsVisible = visible;
            group.interactable = visible;
            group.blocksRaycasts = visible;
            if (immediate) { progress = visible ? 1 : 0; Apply(); }
        }
        private void Update()
        {
            float target = IsVisible ? 1 : 0;
            if (Mathf.Approximately(progress, target)) return;
            progress = transition == null || transition.duration <= 0 ? target :
                Mathf.MoveTowards(progress, target, Time.unscaledDeltaTime / transition.duration);
            Apply();
        }
        private void Apply()
        {
            float t = transition == null ? progress : transition.curve.Evaluate(progress);
            group.alpha = transition == null || transition.fade ? t : (progress > 0 ? 1 : 0);
            rect.anchoredPosition = origin + (transition == null ? Vector2.zero : transition.hiddenOffset * (1 - t));
        }
    }
}
