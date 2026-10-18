/* Keep live values current without replacing unchanged DOM children. */
const coffeeHTMLPaint=new WeakMap();
const CoffeePaint={
 html(el,value){
  if(!el)return;
  const current=el.innerHTML,previous=coffeeHTMLPaint.get(el);
  if(previous&&previous.value===value&&previous.html===current)return;
  if(current!==value)el.innerHTML=value;
  coffeeHTMLPaint.set(el,{value,html:el.innerHTML});
 },
 text(el,value){value=String(value);if(el&&el.textContent!==value)el.textContent=value;},
 attr(el,name,value){value=String(value);if(el&&el.getAttribute(name)!==value)el.setAttribute(name,value);},
 style(el,name,value){value=String(value);if(el&&el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);}
};
if(typeof module!=='undefined'&&module.exports)module.exports=CoffeePaint;
