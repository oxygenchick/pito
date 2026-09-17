using UnityEngine;

namespace Pito.Configuration
{
    [CreateAssetMenu(menuName = "Pito/Game balance")]
    public sealed class GameBalance : ScriptableObject
    {
        [Min(0)] public float affectionLossPerGameHour = 4;
        [Min(0)] public float satietyLossPerGameHour = 6;
        [Min(0)] public float cleanlinessLossPerGameHour = 3;
        [Min(0)] public float affectionPerRealSecond = 12;
        [Min(1)] public float strokeThresholdPixels = 12;
        [Min(0)] public double maxOfflineRealHours = 24;
        [Min(0)] public float normalTimeMultiplier = 1;
        [Min(0)] public int startingMoney = 30;
        public Color[] petColors = { new Color(.65f,.40f,.76f), new Color(.42f,.67f,.78f),
            new Color(.88f,.64f,.45f), new Color(.52f,.73f,.57f) };
    }
}
