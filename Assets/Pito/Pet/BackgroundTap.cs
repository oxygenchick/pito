using UnityEngine;
using UnityEngine.Events;
using UnityEngine.EventSystems;

namespace Pito.Pet
{
    public sealed class BackgroundTap : MonoBehaviour, IPointerClickHandler
    {
        public UnityEvent onTap = new UnityEvent();
        public void OnPointerClick(PointerEventData e) => onTap.Invoke();
    }
}
