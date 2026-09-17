using UnityEngine;
using TMPro;
using Pito.Core;
using Pito.Infrastructure;
using Pito.Pet;
using Pito.UI;

namespace Pito.Tutorial
{
    public sealed class TutorialDirector : MonoBehaviour
    {
        public GameRuntime runtime;
        public TutorialOverlay overlay;
        public PetInteraction pet;
        public NeedsView needs;
        public FoodMenu food;
        public GameObject hud;
        public TMP_Text message, arrow;
        public RectTransform foodButton, foodMenuArea, confirmationArea;
        private bool inGame;
        private float showAt;

        private void Start()
        {
            pet.Tapped += OnPet;
            food.Opened += () => { if (Active && Step == TutorialStep.OpenFood) SetStep(TutorialStep.ChooseFood); };
            food.FoodSelected += () => { if (Active) SetStep(TutorialStep.ConfirmFood); };
            food.Cancelled += () => { if (Active) SetStep(TutorialStep.ChooseFood); };
            food.Fed += () => { if (Active) SetStep(TutorialStep.FinishedMessage); };
            overlay.BackgroundTapped += () => { if (Active && Step == TutorialStep.FinishedMessage) SetStep(TutorialStep.Complete); };
        }
        private bool Active => inGame && runtime.TutorialActive;
        private TutorialStep Step => runtime.Session.Profile.tutorialStep;
        public void EnterGame()
        {
            inGame = true;
            // A pending selection is UI state, not a completed action. Reopen the catalogue after resume.
            if (runtime.TutorialActive && Step == TutorialStep.ConfirmFood)
                runtime.Session.SetTutorialStep(TutorialStep.ChooseFood);
            showAt = Time.unscaledTime + .65f;
            Refresh();
            if (Active && Step == TutorialStep.ChooseFood) food.Open();
        }
        public void LeaveGame() { inGame = false; overlay.gameObject.SetActive(false); }
        private void OnPet()
        {
            if (Active && Step == TutorialStep.MeetPet) { needs.Show(); SetStep(TutorialStep.OpenFood); }
            else if (!Active) needs.Toggle();
        }
        public void SetEnabled(bool value)
        {
            if (runtime.Session == null) return;
            runtime.Session.Profile.tutorialEnabled = value;
            if (value && Step == TutorialStep.Complete) runtime.Session.SetTutorialStep(TutorialStep.MeetPet);
            food.Close(); needs.Hide(); Refresh(); runtime.Save();
            if (Active && (Step == TutorialStep.ChooseFood || Step == TutorialStep.ConfirmFood))
            { SetStep(TutorialStep.ChooseFood); food.Open(); }
        }
        private void SetStep(TutorialStep step) { runtime.Session.SetTutorialStep(step); runtime.Save(); Refresh(); }
        private void Update()
        {
            if (Active && Step == TutorialStep.MeetPet)
                message.transform.parent.gameObject.SetActive(Time.unscaledTime >= showAt);
        }
        public void Refresh()
        {
            overlay.gameObject.SetActive(Active);
            hud.SetActive(inGame && (!Active || Step != TutorialStep.MeetPet));
            if (!Active) return;
            message.transform.parent.gameObject.SetActive(true);
            overlay.allowedUi = null; overlay.allowedPet = null; overlay.blockAll = false;
            arrow.text = "";
            switch (Step)
            {
                case TutorialStep.MeetPet:
                    message.text = "Нажми на Пито, чтобы узнать\nо нём и его потребностях";
                    overlay.allowedPet = pet.GetComponent<Collider2D>(); arrow.text = "↓"; break;
                case TutorialStep.OpenFood:
                    message.text = "Ой, Пито проголодался!\nПокорми его. Помни: еда стоит штучек.";
                    overlay.allowedUi = foodButton; arrow.text = "↑"; break;
                case TutorialStep.ChooseFood:
                    message.text = "Выбери еду.\nПосмотри, сколько она стоит.";
                    overlay.allowedUi = foodMenuArea; break;
                case TutorialStep.ConfirmFood:
                    message.text = "Проверь цену и подтверди покупку.";
                    overlay.allowedUi = confirmationArea; break;
                case TutorialStep.FinishedMessage:
                    message.text = "Отлично, продолжай в том же духе!\nНажми в любом месте, чтобы продолжить.";
                    overlay.blockAll = true; break;
            }
        }
    }
}
