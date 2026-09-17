using System;
using UnityEngine;
using UnityEngine.EventSystems;
using Pito.Core;
using Pito.Infrastructure;

namespace Pito.Pet
{
    [RequireComponent(typeof(Collider2D))]
    public sealed class PetInteraction : MonoBehaviour, IPointerClickHandler, IBeginDragHandler,
        IDragHandler, IEndDragHandler, IPointerUpHandler
    {
        public GameRuntime runtime;
        public RectTransform hand;
        public Canvas uiCanvas;
        public event Action Tapped;
        private bool stroking;
        private Vector2 previous;
        private float lastMovement;
        private bool touching;
        private Collider2D hitArea;
        private void Awake() { hitArea = GetComponent<Collider2D>(); }
        public void OnPointerClick(PointerEventData e) { if (!stroking && !e.dragging) Tapped?.Invoke(); }
        public void OnBeginDrag(PointerEventData e)
        {
            if (runtime.TutorialActive) return;
            stroking = true; previous = e.pressPosition; OnDrag(e);
        }
        public void OnDrag(PointerEventData e)
        {
            if (!stroking || runtime.TutorialActive) return;
            var camera = e.pressEventCamera;
            if (camera == null) return;
            var world = camera.ScreenToWorldPoint(new Vector3(e.position.x, e.position.y, -camera.transform.position.z));
            touching = hitArea.OverlapPoint(world);
            if (Vector2.Distance(previous, e.position) >= runtime.balance.strokeThresholdPixels)
            { lastMovement = Time.unscaledTime; previous = e.position; }
            hand.gameObject.SetActive(touching);
            RectTransformUtility.ScreenPointToLocalPointInRectangle((RectTransform)hand.parent, e.position,
                uiCanvas.renderMode == RenderMode.ScreenSpaceOverlay ? null : uiCanvas.worldCamera, out var local);
            hand.anchoredPosition = local;
        }
        private void Update()
        {
            if (stroking && touching && Time.unscaledTime - lastMovement < .12f && runtime.Session != null)
                runtime.Session.ChangeNeed(NeedKind.Affection, runtime.balance.affectionPerRealSecond * Time.unscaledDeltaTime);
        }
        public void OnEndDrag(PointerEventData e) { StopStroke(); }
        public void OnPointerUp(PointerEventData e) { if (!e.dragging) StopStroke(); }
        private void OnDisable() { StopStroke(); }
        private void StopStroke() { stroking = false; touching = false; if (hand != null) hand.gameObject.SetActive(false); }
    }
}
