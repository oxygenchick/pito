using System;
using UnityEngine;

namespace Pito.Configuration
{
    [Serializable]
    public sealed class FoodDefinition
    {
        public string id;
        public string title;
        public Sprite icon;
        [Min(0)] public int price;
        [Range(1,100)] public float satiety;
    }

    [CreateAssetMenu(menuName = "Pito/Food catalog")]
    public sealed class FoodCatalog : ScriptableObject
    {
        public FoodDefinition[] items = Array.Empty<FoodDefinition>();
    }
}
