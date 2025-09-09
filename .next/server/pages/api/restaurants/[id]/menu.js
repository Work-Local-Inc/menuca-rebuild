"use strict";(()=>{var e={};e.id=611,e.ids=[611],e.modules={2885:e=>{e.exports=require("@supabase/supabase-js")},1287:e=>{e.exports=require("next/dist/compiled/next-server/pages-api.runtime.prod.js")},2363:(e,r,i)=>{i.r(r),i.d(r,{config:()=>m,default:()=>d,routeModule:()=>u});var t={};i.r(t),i.d(t,{default:()=>handler});var s=i(1802),o=i(7153),a=i(6249),n=i(6091);async function handler(e,r){if("GET"!==e.method)return r.status(405).json({error:"Method not allowed"});try{let{id:i}=e.query;if(!i||"string"!=typeof i)return r.status(400).json({error:"Restaurant ID is required"});console.log("\uD83D\uDD0D Fetching menu for restaurant ID:",i);let{data:t,error:s}=await n.p.from("restaurant_menus").select("*").eq("restaurant_id",i).eq("is_active",!0).order("created_at",{ascending:!1}).limit(1),o=Array.isArray(t)?t[0]:null;if(s)return console.warn("⚠️ No active menu yet or error fetching restaurant menu. Returning empty menu.",s),r.status(200).json({success:!0,menu:[],categories:[],message:"Menu not available yet"});if(!o)return console.log("⚠️ No active menu found for restaurant"),r.status(200).json({success:!0,menu:[],categories:[],message:"No menu items found"});console.log("✅ Found restaurant menu:",o.name);let{data:a,error:d}=await n.p.from("menu_sections").select("id, name, display_order").eq("menu_id",o.id).order("display_order",{ascending:!0});if(d)return console.error("❌ Error fetching categories:",d),r.status(500).json({error:"Error fetching categories",details:d.message,code:d.code});console.log(`✅ Found ${a?.length||0} categories`);let m=a?.map(e=>e.id)||[],u=[];if(m.length>0){let{data:e,error:i}=await n.p.from("menu_section_items").select(`
          id,
          menu_section_id,
          position,
          name_override,
          desc_override,
          price_override,
          items:items!inner(
            id,
            base_name,
            base_desc,
            base_price
          )
        `).in("menu_section_id",m).order("position",{ascending:!0});if(i)return console.error("❌ Error fetching menu items:",i),r.status(500).json({error:"Error fetching menu items",details:i.message,code:i.code});u=e||[]}console.log(`✅ Found ${u.length} menu items`);let l=new Map;for(let e of u)e.items?.id&&l.set(e.items.id,e);let _=Array.from(l.keys()),c={};if(_.length>0){let{data:e}=await n.p.from("item_modifier_groups").select(`
          item_id,
          min_selection,
          max_selection,
          required,
          display_order,
          modifier_groups:modifier_groups!inner(
            id,
            name,
            min_selection,
            max_selection,
            required,
            display_order,
            modifier_options:modifier_options(* )
          )
        `).in("item_id",_).order("display_order",{ascending:!0});for(let r of e||[]){let e=c[r.item_id]||[];e.push({id:r.modifier_groups.id,name:r.modifier_groups.name,min:r.min_selection??r.modifier_groups.min_selection,max:r.max_selection??r.modifier_groups.max_selection,required:r.required??r.modifier_groups.required,display_order:r.display_order??r.modifier_groups.display_order,options:(r.modifier_groups.modifier_options||[]).map(e=>({id:e.id,name:e.name,price_delta:Number(e.price_delta||0),quantity_allowed:!!e.quantity_allowed,max_per_option:e.max_per_option??1,default_selected:!!e.default_selected,is_available:!1!==e.is_available}))}),c[r.item_id]=e}}let p=u.map(e=>({id:e.id,name:e.name_override??e.items?.base_name??"",description:e.desc_override??e.items?.base_desc??"",price:parseFloat(e.price_override??e.items?.base_price??0)||0,category:a?.find(r=>r.id===e.menu_section_id)?.name||"Other",dietary_tags:[],prep_time:15,rating:4.5,is_popular:!1,image_url:e.image_url||null,is_active:e.is_active??!0,category_id:e.menu_section_id,modifiers:c[e.items?.id]||[]})),g=(a||[]).map(e=>({id:e.id,name:e.name,description:"",display_order:e.display_order,items_count:u.filter(r=>r.menu_section_id===e.id).length}));return r.status(200).json({success:!0,menu:p,categories:g,restaurant_menu:{id:o.id,name:o.name,description:o.description},stats:{total_items:p.length,total_categories:a?.length||0}})}catch(e){return console.error("❌ API Error:",e),r.status(500).json({error:"Internal server error",details:e instanceof Error?e.message:"Unknown error"})}}let d=(0,a.l)(t,"default"),m=(0,a.l)(t,"config"),u=new s.PagesAPIRouteModule({definition:{kind:o.x.PAGES_API,page:"/api/restaurants/[id]/menu",pathname:"/api/restaurants/[id]/menu",bundlePath:"",filename:""},userland:t})}};var r=require("../../../../webpack-api-runtime.js");r.C(e);var __webpack_exec__=e=>r(r.s=e),i=r.X(0,[4222,6091],()=>__webpack_exec__(2363));module.exports=i})();