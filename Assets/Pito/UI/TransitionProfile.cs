using UnityEngine;

namespace Pito.UI
{
    [CreateAssetMenu(menuName = "Pito/UI transition")]
    public sealed class TransitionProfile : ScriptableObject
    {
        [Min(0)] public float duration = .22f;
        public Vector2 hiddenOffset = new Vector2(0, -24);
        public bool fade = true;
        public AnimationCurve curve = AnimationCurve.EaseInOut(0, 0, 1, 1);
    }
}
