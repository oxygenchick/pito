using System;
using System.Collections.Generic;

namespace Pito.Core
{
    public enum NeedKind { Affection, Satiety, Cleanliness }
    public enum TutorialStep { MeetPet, OpenFood, ChooseFood, ConfirmFood, FinishedMessage, Complete }

    [Serializable]
    public sealed class MoneyOperation
    {
        public string source;
        public int amount;
        public double gameSeconds;
    }

    [Serializable]
    public sealed class PlayerProfile
    {
        public int version = 1;
        public string petName = "Пито Первый";
        public string petTypeId = "pito";
        public string petVariantId = "classic";
        public int colorIndex;
        public float affection = 65;
        public float satiety = 25;
        public float cleanliness = 85;
        public int money = 30;
        public int savings;
        public double gameSeconds;
        public long lastUtcTicks;
        public TutorialStep tutorialStep;
        public bool tutorialEnabled = true;
        public List<MoneyOperation> operations = new List<MoneyOperation>();
    }

    // Pure game rules: independent of the scene, frame rate, input and pet artwork.
    public sealed class GameSession
    {
        public PlayerProfile Profile { get; }
        public event Action Changed;
        public event Action<string> Fed;

        public GameSession(PlayerProfile profile) { Profile = profile; }
        public float GetNeed(NeedKind kind) => kind == NeedKind.Affection ? Profile.affection :
            kind == NeedKind.Satiety ? Profile.satiety : Profile.cleanliness;

        public void ChangeNeed(NeedKind kind, float delta)
        {
            if (float.IsNaN(delta) || float.IsInfinity(delta)) return;
            SetNeed(kind, GetNeed(kind) + delta);
            Changed?.Invoke();
        }

        private void SetNeed(NeedKind kind, double value)
        {
            float next = (float)Math.Max(0, Math.Min(100, value));
            if (kind == NeedKind.Affection) Profile.affection = next;
            else if (kind == NeedKind.Satiety) Profile.satiety = next;
            else Profile.cleanliness = next;
        }

        public void Advance(double seconds, float affectionPerHour, float satietyPerHour, float cleanPerHour)
        {
            if (double.IsNaN(seconds) || double.IsInfinity(seconds) || seconds <= 0) return;
            Profile.gameSeconds += seconds;
            SetNeed(NeedKind.Affection, Profile.affection - Math.Max(0, affectionPerHour) * seconds / 3600);
            SetNeed(NeedKind.Satiety, Profile.satiety - Math.Max(0, satietyPerHour) * seconds / 3600);
            SetNeed(NeedKind.Cleanliness, Profile.cleanliness - Math.Max(0, cleanPerHour) * seconds / 3600);
            Changed?.Invoke();
        }

        public bool TryFeed(string foodId, int price, float restoration)
        {
            if (string.IsNullOrEmpty(foodId) || price < 0 || restoration <= 0 ||
                float.IsNaN(restoration) || float.IsInfinity(restoration) || Profile.money < price) return false;
            Profile.money -= price;
            SetNeed(NeedKind.Satiety, Profile.satiety + restoration);
            Profile.operations.Add(new MoneyOperation { source = foodId, amount = -price, gameSeconds = Profile.gameSeconds });
            if (Profile.operations.Count > 200) Profile.operations.RemoveAt(0);
            Changed?.Invoke();
            Fed?.Invoke(foodId);
            return true;
        }

        public void SetTutorialStep(TutorialStep step)
        {
            Profile.tutorialStep = step;
            Changed?.Invoke();
        }
    }
}
