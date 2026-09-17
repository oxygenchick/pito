using UnityEngine;
using TMPro;
using Pito.Core;
using Pito.Infrastructure;

namespace Pito.UI
{
    public sealed class NeedsView : MonoBehaviour
    {
        public GameRuntime runtime;
        public PanelView panel;
        public UnityEngine.UI.Image[] rings;
        public TMP_Text[] values;
        private float hideAt;
        public void Toggle() { hideAt = 0; panel.Toggle(); }
        public void Hide() { hideAt = 0; panel.Hide(); }
        public void Show() { hideAt = 0; panel.Show(); }
        public void ShowFeedback() { panel.Show(); hideAt = Time.unscaledTime + 2; }
        private void Update()
        {
            if (runtime.Session == null) return;
            for (int i = 0; i < rings.Length; i++)
            {
                float n = runtime.Session.GetNeed((NeedKind)i);
                rings[i].fillAmount = Mathf.MoveTowards(rings[i].fillAmount, n / 100, Time.unscaledDeltaTime * .8f);
                // Keep the empty arc centred: depletion grows symmetrically on both sides.
                rings[i].rectTransform.localEulerAngles = new Vector3(0, 0, -180 * (1 - rings[i].fillAmount));
                values[i].text = Mathf.RoundToInt(n) + "%";
            }
            if (hideAt > 0 && Time.unscaledTime >= hideAt) Hide();
        }
    }
}
