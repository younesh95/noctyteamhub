const maps=['Dust2','Mirage','Anubis','Cache','Ancient','Nuke','Inferno'];
export function validFrame(frame){
 const p=frame?.plan;
 if(!p||!maps.includes(p.map)||!['T','CT'].includes(p.side)||!['upper','lower'].includes(p.level)||typeof frame.title!=='string'||frame.title.length>150||!Number.isFinite(frame.time)||frame.time<5||frame.time>135||!Array.isArray(p.marks)||p.marks.length>500)return false;
 const point=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.y)&&q.x>=0&&q.y>=0&&q.x<=1000&&q.y<=1000;
 return (!frame.cursor||point(frame.cursor))&&p.marks.every(m=>typeof m.id==='string'&&typeof m.label==='string'&&m.label.length<=200&&/^#[0-9a-f]{6}$/i.test(m.color)&&['upper','lower'].includes(m.level)&&['Joueur','Flèche','Dessin','Smoke','Flash','Molotov','HE','Texte'].includes(m.tool)&&Number.isFinite(m.time)&&m.time>=5&&m.time<=135&&Array.isArray(m.points)&&m.points.length>=1&&m.points.length<=2000&&m.points.every(point));
}
