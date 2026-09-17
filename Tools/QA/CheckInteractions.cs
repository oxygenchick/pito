var app = UnityEngine.Object.FindFirstObjectByType<Pito.UI.AppFlow>();
var runtime=app.runtime;
if(runtime.Session?.Profile.petName!="Тестовый Пито")throw new System.Exception("Requires the QA pet; refusing to reset another profile.");
var results=new System.Collections.Generic.List<string>();
void Check(bool value,string name){if(!value)throw new System.Exception(name);results.Add(name);}
Check(app.startLabel.text=="Продолжить" && runtime.Session.Profile.money==27,"Saved profile survives Play Mode restart");
runtime.SetTimeMultiplier(0);
app.EnterGame();
UnityEngine.Application.runInBackground=true;
UnityEngine.EventSystems.PointerEventData Pointer(UnityEngine.GameObject target)
{
    UnityEngine.Canvas.ForceUpdateCanvases();
    UnityEngine.Vector2 position=target.transform is UnityEngine.RectTransform r ?
        UnityEngine.RectTransformUtility.WorldToScreenPoint(null,r.TransformPoint(r.rect.center)) :
        UnityEngine.Camera.main.WorldToScreenPoint(target.transform.position);
    var e=new UnityEngine.EventSystems.PointerEventData(UnityEngine.EventSystems.EventSystem.current){position=position,pressPosition=position};
    var hits=new System.Collections.Generic.List<UnityEngine.EventSystems.RaycastResult>();
    UnityEngine.EventSystems.EventSystem.current.RaycastAll(e,hits);
    if(hits.Count==0)throw new System.Exception("No hit "+target.name);
    e.pointerPressRaycast=e.pointerCurrentRaycast=hits[0];return e;
}
void Click(UnityEngine.GameObject target){var e=Pointer(target);UnityEngine.EventSystems.ExecuteEvents.ExecuteHierarchy(e.pointerCurrentRaycast.gameObject,e,UnityEngine.EventSystems.ExecuteEvents.pointerClickHandler);}
System.Collections.IEnumerator Run()
{
    yield return new UnityEngine.WaitForSecondsRealtime(.5f);
    var pet=app.tutorial.pet;
    Click(pet.gameObject);Check(app.needs.panel.IsVisible,"Tap shows needs");
    Click(pet.gameObject);Check(!app.needs.panel.IsVisible,"Second tap hides needs");
    float before=runtime.Session.Profile.affection;
    var drag=Pointer(pet.gameObject);drag.dragging=true;
    pet.OnBeginDrag(drag);
    for(int i=0;i<12;i++)
    {
        drag.position=drag.pressPosition+new UnityEngine.Vector2(i%2==0?35:-35,0);
        pet.OnDrag(drag);yield return new UnityEngine.WaitForSecondsRealtime(.05f);
    }
    Check(pet.hand.gameObject.activeSelf,"Stroking displays hand sprite");
    pet.OnEndDrag(drag);
    Check(runtime.Session.Profile.affection>before && !pet.hand.gameObject.activeSelf,"Stroking restores affection and releases hand");
    app.food.Open();yield return new UnityEngine.WaitForSecondsRealtime(.3f);
    Click(app.food.next.gameObject);Click(app.food.next.gameObject);
    Check(app.food.cards.Count(c=>c.gameObject.activeSelf)==2,"Last food page has two items");
    Click(app.food.next.gameObject);Check(app.food.cards.Count(c=>c.gameObject.activeSelf)==4,"Food pages wrap");
    app.food.Close();
    var trigger=UnityEngine.Object.FindFirstObjectByType<Pito.UI.LongPressTrigger>();
    var hold=Pointer(trigger.gameObject);
    UnityEngine.EventSystems.ExecuteEvents.ExecuteHierarchy(hold.pointerCurrentRaycast.gameObject,hold,UnityEngine.EventSystems.ExecuteEvents.pointerDownHandler);
    yield return new UnityEngine.WaitForSecondsRealtime(1.4f);
    var debug=UnityEngine.Object.FindFirstObjectByType<Pito.UI.DebugMenu>();
    Check(debug.panel.IsVisible,"Corner long hold opens debug menu");
    Click(debug.speedButtons[3].gameObject);Check(runtime.TimeMultiplier==144,"Debug speed changes simulation coefficient");
    runtime.SetTimeMultiplier(1);
    double seconds=runtime.Session.Profile.gameSeconds;
    Click(debug.absence.gameObject);
    Check(runtime.Session.Profile.gameSeconds>=seconds+3600,"Debug absence advances simulation");
    Click(debug.reset.gameObject);Check(runtime.Session!=null,"Reset requires confirmation");
    Click(debug.reset.gameObject);
    Check(runtime.Session==null && new Pito.Infrastructure.ProfileStore().Load()==null,"Reset deletes current and backup profile");
    Check(app.titleScreen.activeSelf && app.startLabel.text=="Новый Пито","Reset restores first-launch screen");
    UnityEngine.Debug.Log("PITO_INTERACTIONS_PASS: "+string.Join("; ",results));
}
app.StartCoroutine(Run());
return "Interaction QA scheduled";
