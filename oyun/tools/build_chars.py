# Karakterleri Quaternius Superhero_Male tabanından üretir (CC0).
# Çalıştır: blender -b --python tools/build_chars.py [-- oguz kormos tepegoz anims]
# Çıktı: src/assets/<ad>.glb, src/assets/anims.glb, tools/preview_<ad>_*.png
import bpy, bmesh, math, os, sys
from mathutils import Vector, Matrix

A = "C:/Users/kadir/Desktop/Claude Gerkenler/"
UBC = A + "ubc/Universal Base Characters[Standard]/"
UAL = A + "ual/Universal Animation Library[Standard]/Unreal-Godot/UAL1_Standard.glb"
UAL2 = A + "ual2/Universal Animation Library 2[Standard]/Unreal-Godot/UAL2_Standard.glb"
HORSE = A + "animals/glTF/Horse.gltf"
WOLF = A + "animals/glTF/Wolf.gltf"
HORSE_WHITE = A + "animals/glTF/Horse_White.gltf"
STAG = A + "animals/glTF/Stag.gltf"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "src", "assets")
TOOLS = os.path.join(ROOT, "tools")
os.makedirs(OUT, exist_ok=True)

ANIMS = ["Zombie_Idle_Loop", "Zombie_Walk_Fwd_Loop", "Jog_Fwd_Loop", "Sprint_Loop", "Jump_Start", "Jump_Loop", "Jump_Land", "Roll", "Sword_Attack", "Spell_Simple_Shoot",
         "Hit_Chest", "Hit_Head", "Death01", "Idle_Loop", "Sword_Idle", "Punch_Cross", "Punch_Jab", "Walk_Loop",
         "Sitting_Idle_Loop", "Zombie_Scratch", "Crouch_Idle_Loop",
         # UAL2
         "Sword_Regular_A", "Sword_Regular_B", "Sword_Regular_C", "Sword_Dash", "Sword_Heavy_Combo", "OverhandThrow",
         "Slide_Start", "Slide_Loop", "Slide_Exit", "NinjaJump_Start", "NinjaJump_Idle_Loop", "NinjaJump_Land",
         "Hit_Knockback", "Idle_Shield_Loop", "Idle_Shield_Break", "Shield_Dash"]

COLORS = {
    "Kaftan": "1c3f8a", "Gold": "d9a520", "Leather": "5a3417", "Trouser": "5b2320", "Boot": "3d2616",
    "Fur": "8a6a4a", "Bork": "b3202a", "Steel": "c9d1d9", "Wood": "6b3f1d", "Iron": "3b3d42",
    "Dark": "241c2b", "Blood": "8e1a1a", "Bone": "e6dcc2", "EyeWhite": "f4f1e8", "Iris": "c21d1d", "Black": "111111",
    "DarkFur": "3a2c22", "BloodDark": "4a0a0e", "Pelt": "6e5a44", "Feather": "eab54a", "Horn": "1c1612", "Straw": "d9b04a", "Lacquer": "7a1a14", "Jade": "2f6e5a", "Rag": "8a7358", "Cloth": "ddd5c4", "Jewel": "c21d4a",
    "GoldDark": "9a6a10", "Pelt2": "5a3a22",
    "GlowRed": "ff3020", "GlowGreen": "9aff6a", "GlowYellow": "ffd23a", "Copper": "c8743a", "Moss": "3e5a2a", "Swamp": "4a5a3a",
    "Cape": "d8d8d8", "Sash": "d8d8d8", "Kurk": "d8d8d8",  # yiğide göre koddan boyanır
    "Hide": "7a5a3a", "TepeSkin": "9aa37e", "Coat1": "141418", "Coat2": "ecebe4", "Coat3": "2a2a30", "RedSkin": "8e2a1c",
}

RX = lambda a: Matrix.Rotation(a, 3, "X")
RY = lambda a: Matrix.Rotation(a, 3, "Y")
RZ = lambda a: Matrix.Rotation(a, 3, "Z")
S = {}  # o anki karakterin durumu: arm, body, coll, M, REG


# ---------- temel ----------
def mat(name, rgb):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    bsdf = m.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = (*[c ** 2.2 for c in rgb], 1)
    bsdf.inputs["Roughness"].default_value = 0.8
    return m


def setup(hairs, base="Superhero_Male_FullBody"):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=UBC + f"Base Characters/Godot - UE/{base}.gltf")
    S["arm"] = arm = bpy.data.objects["Armature"]
    for o in list(bpy.data.objects):
        if o.name.startswith("Icosphere"):
            bpy.data.objects.remove(o)
    S["body"] = body = max((o for o in bpy.data.objects if o.type == "MESH"), key=lambda o: len(o.data.vertices))
    S["M"] = {k: mat("M_" + k, tuple(int(v[i:i + 2], 16) / 255 for i in (0, 2, 4))) for k, v in COLORS.items()}
    S["coll"] = coll = body.users_collection[0]
    for hair in hairs:  # Head kemiğine bağlı gelir; bizim iskelete taşınır
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=UBC + f"Hairstyles/Rigged to Head Bone/glTF (Godot -Unreal)/{hair}.gltf")
        new = set(bpy.data.objects) - before
        for o in new:
            if o.type == "MESH" and not o.name.startswith("Icosphere"):
                mw = o.matrix_world.copy()
                o.parent = arm
                o.matrix_world = mw
                for mod in o.modifiers:
                    if mod.type == "ARMATURE":
                        mod.object = arm
                if o.name not in coll.objects:
                    for c in o.users_collection:
                        c.objects.unlink(o)
                    coll.objects.link(o)
        for o in new:
            if o.type != "MESH" or o.name.startswith("Icosphere"):
                bpy.data.objects.remove(o)
    groups = {g.index: g.name for g in body.vertex_groups}

    def region(v):
        if not v.groups:
            return "skin"
        n = groups[max(v.groups, key=lambda g: g.weight).group]
        if n.startswith(("pelvis", "spine", "clavicle")):
            return "torso"
        if n.startswith(("upperarm", "lowerarm")):
            return "arm"
        if n.startswith("thigh"):
            return "leg"
        if n.startswith(("calf", "foot", "ball")):
            return "boot"
        return "skin"

    S["REG"] = [region(v) for v in body.data.vertices]


# ---------- kıyafet kabukları: gövdeden kopyalanır, aynı ağırlıklarla deforme olur ----------
def shell(name, regions, offset, pick, post=None):
    """pick(center) -> malzeme adı ya da None (yüzü at)."""
    body, REG, M = S["body"], S["REG"], S["M"]
    ob = body.copy()
    ob.data = body.data.copy()
    ob.name = ob.data.name = name
    S["coll"].objects.link(ob)
    bm = bmesh.new()
    bm.from_mesh(ob.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if not any(REG[v.index] in regions for v in f.verts)], context="FACES")
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if pick(f.calc_center_median()) is None], context="FACES")
    ob.data.materials.clear()
    names = []
    for f in bm.faces:
        k = pick(f.calc_center_median())
        if k not in names:
            names.append(k)
            ob.data.materials.append(M[k])
        f.material_index = names.index(k)
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * offset
    if post:
        post(bm)
    bm.to_mesh(ob.data)
    bm.free()
    return ob


def drop_toes(bm):
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if f.calc_center_median().z < 0.11], context="FACES")


def boot_feet(material):
    # Çizme ayağı: ayak köşelerinin dışbükey zarfı (parmak şekli kalmaz, ağırlıklar korunur)
    body = S["body"]
    feet = body.copy()
    feet.data = body.data.copy()
    feet.name = feet.data.name = "BootFeet"
    S["coll"].objects.link(feet)
    bm = bmesh.new()
    bm.from_mesh(feet.data)
    bm.normal_update()
    for v in bm.verts:
        v.co += v.normal * 0.016
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z >= 0.14], context="VERTS")
    bmesh.ops.delete(bm, geom=list(bm.edges), context="EDGES_FACES")
    for side in (-1, 1):
        res = bmesh.ops.convex_hull(bm, input=[v for v in bm.verts if v.co.x * side > 0])
        bmesh.ops.delete(bm, geom=[g for g in res["geom_interior"] if isinstance(g, bmesh.types.BMVert)], context="VERTS")
    bmesh.ops.delete(bm, geom=[v for v in bm.verts if not v.link_faces], context="VERTS")
    for v in bm.verts:
        v.co.z = max(v.co.z, 0.004)
    bm.to_mesh(feet.data)
    bm.free()
    feet.data.materials.clear()
    feet.data.materials.append(S["M"][material])
    for p in feet.data.polygons:
        p.material_index = 0
        p.use_smooth = False


def hide_skin(regions):
    # kıyafetin tamamen örttüğü deri yüzeyleri sil (hareket ederken içinden taşmasın)
    body, REG = S["body"], S["REG"]
    bm = bmesh.new()
    bm.from_mesh(body.data)
    bm.verts.ensure_lookup_table()
    bmesh.ops.delete(bm, geom=[f for f in bm.faces if all(REG[v.index] in regions for v in f.verts)], context="FACES")
    bm.to_mesh(body.data)
    bm.free()


# ---------- aksesuar yardımcıları ----------
def solid(name, build, material, smooth=False):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    build(bm)
    bm.to_mesh(me)
    bm.free()
    for p in me.polygons:
        p.use_smooth = smooth
    me.materials.append(S["M"][material])
    ob = bpy.data.objects.new(name, me)
    S["coll"].objects.link(ob)
    return ob


def join(name, parts, bone):
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    ob = parts[0]
    ob.name = name
    mw = ob.matrix_world.copy()
    ob.parent = S["arm"]
    ob.parent_type = "BONE"
    ob.parent_bone = bone
    ob.matrix_world = mw
    return ob


def place(parts, at, rot):
    for p in parts:
        p.data.transform(Matrix.Translation(at) @ rot.to_4x4())
    return parts


def cyl(r1, r2, h, seg=16, at=(0, 0, 0), rot=None):
    def f(bm):
        bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=h)
        if rot:
            bmesh.ops.rotate(bm, verts=bm.verts, matrix=rot)
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(at))
    return f


def box(sx, sy, sz, at=(0, 0, 0), rot=None):
    def f(bm):
        bmesh.ops.create_cube(bm, size=1)
        bmesh.ops.scale(bm, vec=(sx, sy, sz), verts=bm.verts)
        if rot:
            bmesh.ops.rotate(bm, verts=bm.verts, matrix=rot)
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(at))
    return f


def ball(r, at, scale=(1, 1, 1), cut=None):
    def f(bm):
        bmesh.ops.create_uvsphere(bm, u_segments=20, v_segments=12, radius=r)
        if cut is not None:
            bmesh.ops.delete(bm, geom=[v for v in bm.verts if v.co.z < cut * r], context="VERTS")
        bmesh.ops.scale(bm, vec=scale, verts=bm.verts)
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(at))
    return f


def torus(R, r, at, rot, arc=math.tau, seg=24):
    def f(bm):
        rings = []
        for i in range(seg + 1):
            a = -arc / 2 + arc * i / seg
            rings.append([bm.verts.new(Vector(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
                          for b in (math.tau * j / 8 for j in range(8))])
        for i in range(seg):
            for j in range(8):
                bm.faces.new((rings[i][j], rings[i][(j + 1) % 8], rings[i + 1][(j + 1) % 8], rings[i + 1][j]))
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=rot)
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(at))
    return f


def horn(length, r, bend, at, rot):
    # kıvrık boynuz: taban kalın, uca doğru incelir
    def f(bm):
        seg = 10
        rings = []
        for i in range(seg + 1):
            t = i / seg
            c = Vector((0, -bend * t * t, t * length))
            rr = r * (1 - t) + 0.002
            rings.append([bm.verts.new(c + Vector((math.cos(b) * rr, math.sin(b) * rr, 0))) for b in (math.tau * j / 8 for j in range(8))])
        for i in range(seg):
            for j in range(8):
                bm.faces.new((rings[i][j], rings[i][(j + 1) % 8], rings[i + 1][(j + 1) % 8], rings[i + 1][j]))
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=rot)
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(at))
    return f


def saber(bm, length=0.62, width=0.05, thick=0.012, curve=0.09, seg=12):
    # kavisli Türk kılıcı: kabzadan (y=0.1) uca doğru daralır ve kıvrılır
    rows = []
    for i in range(seg + 1):
        t = i / seg
        y, bend = 0.1 + t * length, curve * t * t
        w = width * (1 - 0.55 * t) if i < seg else 0.0
        rows.append([bm.verts.new(p) for p in [(bend - w / 2, y, 0), (bend, y, thick / 2), (bend + w / 2, y, 0), (bend, y, -thick / 2)]])
    for i in range(seg):
        for j in range(4):
            bm.faces.new((rows[i][j], rows[i][(j + 1) % 4], rows[i + 1][(j + 1) % 4], rows[i + 1][j]))
    bm.faces.new(rows[0][::-1])


def sword(prefix, sheathed=False):
    # kabza orijinde, bıçak +Y yönünde
    parts = [
        solid(prefix + "guard", box(0.16, 0.025, 0.03, (0.0, 0.09, 0)), "Gold"),
        solid(prefix + "grip", cyl(0.017, 0.017, 0.15, 8, (0, 0.0, 0), RX(math.pi / 2)), "Leather"),
        solid(prefix + "pommel", cyl(0.026, 0.02, 0.035, 10, (0, -0.09, 0), RX(math.pi / 2)), "Gold"),
    ]
    if sheathed:
        parts.append(solid(prefix + "scab", lambda bm: saber(bm, width=0.068, thick=0.03), "Leather", True))
        parts.append(solid(prefix + "ring", box(0.075, 0.025, 0.035, (0.0, 0.14, 0)), "Gold"))
    else:
        parts.append(solid(prefix + "blade", saber, "Steel"))
    return parts


def bow(bm, R=0.5, arc=1.6, r=0.014, seg=24):
    # YZ düzleminde yay; kiriş sırta yakın, gövde dışa (+Y) kavisli
    rings = []
    for i in range(seg + 1):
        a = -arc / 2 + arc * i / seg
        c = Vector((0, R * math.cos(a) - R * math.cos(arc / 2), R * math.sin(a)))
        t = Vector((0, -math.sin(a), math.cos(a)))
        n1 = Vector((1, 0, 0))
        n2 = t.cross(n1)
        rings.append([bm.verts.new(c + (n1 * math.cos(b) + n2 * math.sin(b)) * r * (1.4 - abs(a) / arc)) for b in (math.tau * j / 8 for j in range(8))])
    for i in range(seg):
        for j in range(8):
            bm.faces.new((rings[i][j], rings[i][(j + 1) % 8], rings[i + 1][(j + 1) % 8], rings[i + 1][j]))
    h = R * math.sin(arc / 2)
    bm.faces.new([bm.verts.new(v) for v in [(0.004, 0, -h), (-0.004, 0, -h), (-0.004, 0, h), (0.004, 0, h)]])


HAND_R = Vector((-0.765, 0.06, 1.435))  # T-pozda sağ avuç; tutulan şey ileri (-Y) bakar
HAND_L = Vector((0.765, 0.06, 1.435))


# ---------- karakterler ----------
def build_oguz():
    setup(["Hair_Long", "Hair_Beard"])

    def kaftan(c):
        if abs(c.x) > 0.64:
            return "Gold"  # kol ağzı
        if c.z > 1.47 and abs(c.x) < 0.2:
            return "Gold"  # yaka
        if 1.0 < c.z < 1.08 and abs(c.x) < 0.3:
            return "Gold" if abs(c.x) < 0.04 and c.y < 0 else "Leather"  # kemer + toka
        if c.z < 1.0:
            return "Trouser"
        if abs(c.x) < 0.025 and c.y < 0 and 1.08 < c.z < 1.47:
            return "Gold"  # ön şerit
        return "Kaftan"

    shell("Kaftan", {"torso", "arm"}, 0.016, kaftan)
    shell("Trousers", {"leg"}, 0.009, lambda c: "Trouser")
    shell("Boots", {"boot"}, 0.014, lambda c: "Fur" if c.z > 0.5 else "Boot", drop_toes)
    boot_feet("Boot")

    HAT = Vector((0, 0.02, 1.765))

    def feather(bm):  # baykuş tüyü (Oğuz boylarının ongunu)
        pts = [(0, 0, 0), (0.022, 0, 0.06), (0.018, 0, 0.14), (0, 0, 0.2), (-0.018, 0, 0.14), (-0.022, 0, 0.06)]
        f = bm.faces.new([bm.verts.new(p) for p in pts])
        bmesh.ops.solidify(bm, geom=[f], thickness=0.004)
        bmesh.ops.rotate(bm, verts=bm.verts, matrix=RX(0.55))
        bmesh.ops.translate(bm, verts=bm.verts, vec=HAT + Vector((0.05, 0.08, 0.06)))

    dome = ball(1, HAT + Vector((0, 0.01, 0.02)), (0.1, 0.108, 0.13), cut=-0.05)
    join("Bork", [
        solid("b1", dome, "Bork", True),
        solid("b2", torus(0.104, 0.038, HAT + Vector((0, 0.005, 0.01)), RX(-0.1)), "Fur", True),
        solid("b3", torus(0.1, 0.009, HAT + Vector((0, 0.012, 0.06)), RX(-0.15)), "Gold", True),
        solid("b4", cyl(0.018, 0.018, 0.03, 8, HAT + Vector((0, 0.03, 0.155))), "Gold"),
        solid("b5", feather, "Fur"),
    ], "Head")
    costume_hats(HAT)
    costume_parts(HAT)
    c_parts(HAT)
    shell("Collar", {"torso", "arm"}, 0.03, lambda c: "Fur" if 1.36 < c.z < 1.5 and abs(c.x) < 0.42 else None)  # Fatih'in kürk yakası
    hide_skin({"torso", "arm", "leg", "boot"})  # kostüm kabukları gövdenin tamamından kopyalandıktan sonra
    join("SwordHand", place(sword("sh"), HAND_R, RZ(math.pi)), "hand_r")
    join("SwordSheath", place(sword("ss", sheathed=True), Vector((0.23, 0.02, 1.04)), RX(-2.05)), "pelvis")
    BACK, QROT = Vector((0, 0.17, 1.28)), RY(0.45)
    QTOP = BACK + Vector((0.02, 0.07, 0.0)) + QROT @ Vector((0, 0, 0.25))
    join("BowBack", place([solid("bow", bow, "Wood", True)], BACK + Vector((0, 0.01, 0)), RY(-0.55)), "spine_03")
    join("Quiver", [
        solid("quiver", cyl(0.055, 0.045, 0.5, 12, BACK + Vector((0.02, 0.07, 0.0)), QROT), "Leather", True),
        *[solid(f"fl{i}", box(0.035, 0.008, 0.12, QTOP + QROT @ Vector((-0.025 + i * 0.025, 0, 0.05))), "Bork") for i in range(3)],
    ], "spine_03")
    # Elde yay: T-pozda kol +X'e uzanır; yay XZ düzleminde, karnı +X'e (kol ileri dönünce ileri bakar)
    GRIP = 0.5 * (1 - math.cos(0.8))
    join("BowHand", place([solid("bowh", bow, "Wood", True),
                           solid("bowg", cyl(0.02, 0.02, 0.1, 8, (0, GRIP, 0)), "Leather")],
                          HAND_L + Vector((0.02 - GRIP, 0, 0)), RZ(-math.pi / 2)), "hand_l")
    # Kirişe takılı ok: sağ avuçtan kolun uzandığı yöne (-X); çekiş pozunda yaya doğru döner
    join("ArrowNock", [
        solid("an1", cyl(0.008, 0.008, 0.8, 6, HAND_R + Vector((-0.4, 0, 0)), RY(math.pi / 2)), "Wood"),
        solid("an2", cyl(0.025, 0.0, 0.08, 4, HAND_R + Vector((-0.84, 0, 0)), RY(-math.pi / 2)), "Iron"),
        solid("an3", box(0.1, 0.004, 0.04, HAND_R + Vector((-0.07, 0, 0.02))), "Bork"),
        solid("an4", box(0.1, 0.04, 0.004, HAND_R + Vector((-0.07, 0.02, 0))), "Bork"),
    ], "hand_r")
    finish("oguz", [("sprint", "Sprint_Loop", 8), ("sword", "Sword_Attack", 12)])


def costume_hats(HAT):
    # Kostüm başlıkları: oyunda seçilen kostüme göre sadece biri görünür
    # Fatih'in kavuğu: kırmızı tepelikli, iri beyaz sarık
    join("Kavuk", [
        solid("k1", ball(1, HAT + Vector((0, 0.01, 0.06)), (0.165, 0.17, 0.13), cut=-0.3), "Cloth", True),
        *[solid(f"k{i + 2}", torus(0.16 - i * 0.015, 0.022, HAT + Vector((0, 0.01, 0.02 + i * 0.045)), RX(0.12 * (1 if i % 2 else -1))), "Cloth", True) for i in range(3)],
        solid("k6", ball(0.06, HAT + Vector((0, 0.01, 0.19)), (1, 1, 0.8)), "Bork", True),
    ], "Head")
    # Babür'ün sarığı: beyaz sarık, altın kuşak, yakutlu sorguç ve tüy
    join("Sarik", [
        solid("s1", ball(1, HAT + Vector((0, 0.01, 0.05)), (0.13, 0.14, 0.1), cut=-0.3), "Cloth", True),
        solid("s2", torus(0.125, 0.018, HAT + Vector((0, 0.01, 0.02)), RX(-0.1)), "Gold", True),
        solid("s3", ball(0.028, HAT + Vector((0, -0.125, 0.06))), "Jewel", True),
        solid("s4", cyl(0.012, 0.03, 0.2, 6, HAT + Vector((0, -0.11, 0.17)), RX(0.25)), "Cloth", True),
    ], "Head")
    # Şah İsmail'in on iki dilimli kızıl Kızılbaş tacı, dibinde beyaz sarık
    join("Taj", [
        solid("t1", cyl(0.07, 0.035, 0.3, 12, HAT + Vector((0, 0.01, 0.17))), "Blood", False),
        solid("t2", torus(0.11, 0.045, HAT + Vector((0, 0.01, 0.03)), RX(0)), "Cloth", True),
        solid("t3", cyl(0.01, 0.01, 0.06, 6, HAT + Vector((0, 0.01, 0.35))), "Blood"),
    ], "Head")


def fringe(depth):
    # alt yüzleri (T-pozda kolların altı) aşağı uzatır: kanat gibi sarkan tüy saçağı
    def f(bm):
        faces = [f for f in bm.faces if f.normal.z < -0.6]
        r = bmesh.ops.extrude_face_region(bm, geom=faces)
        bmesh.ops.translate(bm, verts=[e for e in r["geom"] if isinstance(e, bmesh.types.BMVert)], vec=(0, 0, -depth))
    return f


def costume_parts(HAT):
    # Kitaptaki kostümler: her biri başlık (+ bazıları gövde parçası). Oyunda costumes.js hangisinin görüneceğini seçer.
    # Altın Elbiseli Adam (Esik kurganı, Saka): uzun sivri altın külah, oklar, dağ keçisi figürü; pul pul altın zırh
    join("AltinBork", [
        solid("ab1", cyl(0.108, 0.012, 0.62, 16, HAT + Vector((0, 0.01, 0.3))), "Gold", True),
        solid("ab2", torus(0.108, 0.02, HAT + Vector((0, 0.01, 0.0)), RX(0)), "GoldDark", True),
        *[solid(f"ab{i + 3}", cyl(0.006, 0.006, 0.34, 6, HAT + Vector((x, -0.075, 0.2)), RY(-x * 2)), "GoldDark")
          for i, x in enumerate([-0.05, -0.018, 0.018, 0.05])],
        *[solid(f"ab{i + 7}", cyl(0.018, 0.0, 0.05, 4, HAT + Vector((x * 1.3, -0.075, 0.39))), "Gold")
          for i, x in enumerate([-0.05, -0.018, 0.018, 0.05])],
        solid("ab11", ball(1, HAT + Vector((0, 0.01, 0.63)), (0.03, 0.05, 0.035)), "GoldDark", True),
        solid("ab12", horn(0.07, 0.01, 0.04, HAT + Vector((0, -0.02, 0.65)), RX(0.4)), "Gold"),
        solid("ab13", box(0.02, 0.07, 0.14, HAT + Vector((0.105, 0.01, -0.08))), "Gold"),
        solid("ab14", box(0.02, 0.07, 0.14, HAT + Vector((-0.105, 0.01, -0.08))), "Gold"),
    ], "Head")
    # kızıl giysinin üstünde sıra sıra altın plakalar (aralardan kumaş görünür)
    shell("GoldPlates", {"torso", "arm", "leg"}, 0.024,
          lambda c: None if hashf(c) > 0.7 else ("GoldDark" if hashf(c * 1.7) < 0.3 else "Gold"))
    # Geyik şaman: demir çemberli taç, dallı boynuzlar, çıngıraklar
    ants = [solid("ga0", torus(0.108, 0.02, HAT + Vector((0, 0.01, -0.02)), RX(-0.1)), "Iron", True)]
    for side in (-1, 1):
        base, th = HAT + Vector((side * 0.07, 0.03, 0.02)), side * 0.45
        d = Vector((math.sin(th), 0, math.cos(th)))
        ants.append(solid(f"ga{side}m", horn(0.42, 0.022, -0.12, base, RY(th)), "Bone", True))
        for k, t in enumerate([0.35, 0.6, 0.82]):
            ants.append(solid(f"ga{side}{k}", horn(0.15 - k * 0.03, 0.012, -0.03, base + d * 0.42 * t + Vector((0, 0.03 * t, 0)),
                                                  RY(th + side * 0.7) @ RX(-0.5)), "Bone", True))
    for i, x in enumerate([-0.08, -0.04, 0, 0.04, 0.08]):
        ants.append(solid(f"gb{i}", cyl(0.003, 0.003, 0.08, 4, HAT + Vector((x, -0.1, -0.06))), "Leather"))
        ants.append(solid(f"gc{i}", ball(0.016, HAT + Vector((x, -0.1, -0.11))), "Gold", True))
    join("Antlers", ants, "Head")
    # Kartal şaman: kartal başlı başlık, tüy tepelik; kollarda kanat gibi sarkan tüy saçak
    join("EagleHat", [
        solid("e1", ball(1, HAT + Vector((0, 0.01, 0.0)), (0.108, 0.115, 0.1), cut=-0.1), "Pelt2", True),
        solid("e2", ball(1, HAT + Vector((0, -0.07, 0.08)), (0.06, 0.07, 0.055)), "Cloth", True),
        solid("e3", cyl(0.028, 0.0, 0.1, 6, HAT + Vector((0, -0.19, 0.06)), RX(math.pi / 2 + 0.4)), "Straw", True),
        solid("e4", ball(0.014, HAT + Vector((0.032, -0.135, 0.1))), "Black"),
        solid("e5", ball(0.014, HAT + Vector((-0.032, -0.135, 0.1))), "Black"),
        *[solid(f"e{i + 6}", box(0.035, 0.006, 0.24, HAT + Vector((math.sin(a) * 0.12, 0.07, 0.12 + math.cos(a) * 0.08)), RY(a) @ RX(0.35)), "Pelt2")
          for i, a in enumerate([-0.9, -0.45, 0, 0.45, 0.9])],
    ], "Head")
    # sırtta katlanmış kanat gibi tüy pelerini (koşarken arkadan görünür)
    cape = []
    for side in (-1, 1):
        for k in range(6):
            x, ang = side * (0.03 + k * 0.045), side * (0.05 + k * 0.07)
            top = Vector((x, 0.16 + k * 0.004, 1.44 - k * 0.012))
            ln = 0.5 - k * 0.035
            cape.append(solid(f"fc{side}{k}", box(0.055, 0.012, ln, top + Vector((math.sin(ang) * ln / 2, 0, -ln / 2)), RY(ang)), "Pelt2" if k % 2 else "Pelt"))
            cape.append(solid(f"ft{side}{k}", box(0.05, 0.013, 0.07, top + Vector((math.sin(ang) * ln, 0.002, -ln + 0.03)), RY(ang)), "Cloth"))
    join("Feathers", cape, "spine_03")
    # Ayı şaman: ayı kafası başlık, dişler, sırtta post; demir pençeli eldivenler
    join("BearHat", [
        solid("r1", ball(1, HAT + Vector((0, 0.02, 0.0)), (0.125, 0.135, 0.105), cut=-0.2), "DarkFur", True),
        solid("r2", ball(1, HAT + Vector((0, -0.12, 0.02)), (0.055, 0.075, 0.045)), "DarkFur", True),
        solid("r3", ball(0.022, HAT + Vector((0, -0.195, 0.035))), "Black", True),
        solid("r4", ball(0.038, HAT + Vector((0.085, 0.0, 0.085))), "DarkFur", True),
        solid("r5", ball(0.038, HAT + Vector((-0.085, 0.0, 0.085))), "DarkFur", True),
        *[solid(f"r{i + 6}", cyl(0.01, 0.0, 0.045, 4, HAT + Vector((x, -0.15, -0.035)), RX(math.pi)), "Bone") for i, x in enumerate([-0.045, -0.02, 0.02, 0.045])],
        solid("r10", ball(0.012, HAT + Vector((0.04, -0.11, 0.075))), "Blood", True),
        solid("r11", ball(0.012, HAT + Vector((-0.04, -0.11, 0.075))), "Blood", True),
        solid("r12", box(0.26, 0.04, 0.4, HAT + Vector((0, 0.13, -0.26)), RX(-0.15)), "DarkFur"),
    ], "Head")
    for side, hand, bone in ((1, HAND_L, "hand_l"), (-1, HAND_R, "hand_r")):
        join("ClawL" if side > 0 else "ClawR", [
            solid(f"cl{side}{i}", cyl(0.012, 0.0, 0.09, 4, hand + Vector((side * 0.13, y, -0.01)), RY(side * math.pi / 2)), "Iron")
            for i, y in enumerate([-0.04, -0.013, 0.013, 0.04])
        ], bone)
    # Er-Sogotoh (Yakut ilk insanı): yuvarlak kürk başlık, kulaklık, boncuklu alın plakası
    join("YakutHat", [
        solid("y1", ball(1, HAT + Vector((0, 0.01, 0.03)), (0.125, 0.13, 0.13), cut=-0.2), "DarkFur", True),
        solid("y1b", cyl(0.02, 0.0, 0.08, 6, HAT + Vector((0, 0.01, 0.19))), "Gold"),
        solid("y2", torus(0.135, 0.05, HAT + Vector((0, 0.01, -0.01)), RX(0)), "Fur", True),
        solid("y3", box(0.03, 0.08, 0.16, HAT + Vector((0.12, 0.02, -0.1))), "Fur"),
        solid("y4", box(0.03, 0.08, 0.16, HAT + Vector((-0.12, 0.02, -0.1))), "Fur"),
        *[solid(f"y{i + 5}", ball(0.012, HAT + Vector((x, -0.125, 0.05))), "Jewel" if i % 2 else "Gold", True) for i, x in enumerate([-0.05, -0.025, 0, 0.025, 0.05])],
    ], "Head")
    # Ak Oğlan: sade beyaz alın bağı, ortada altın güneş
    join("Headband", [
        solid("hb1", torus(0.1, 0.013, HAT + Vector((0, 0.01, -0.04)), RX(-0.08)), "Cloth", True),
        solid("hb2", cyl(0.025, 0.025, 0.01, 12, HAT + Vector((0, -0.108, -0.03)), RX(math.pi / 2)), "Gold"),
    ], "Head")
    # Manas: Kırgız ak kalpağı, siyah kıvrık kenar, tepede püskül
    join("Kalpak", [
        solid("kp1", cyl(0.108, 0.045, 0.3, 8, HAT + Vector((0, 0.01, 0.13))), "Cloth", True),
        solid("kp2", box(0.13, 0.02, 0.08, HAT + Vector((0, -0.1, 0.02)), RX(0.25)), "Black"),
        solid("kp3", box(0.13, 0.02, 0.08, HAT + Vector((0, 0.12, 0.02)), RX(-0.25)), "Black"),
        solid("kp4", ball(0.025, HAT + Vector((0, 0.01, 0.3))), "Blood", True),
    ], "Head")
    # Attila: sivri keçe Hun külahı, kürk kenar, altın alın plakaları
    join("HunCap", [
        solid("hc1", cyl(0.105, 0.015, 0.34, 12, HAT + Vector((0, 0.03, 0.15)), RX(0.2)), "BloodDark", True),
        solid("hc2", torus(0.108, 0.03, HAT + Vector((0, 0.01, -0.01)), RX(0)), "Fur", True),
        *[solid(f"hc{i + 3}", box(0.03, 0.01, 0.04, HAT + Vector((math.sin(a) * 0.13, -math.cos(a) * 0.13, 0.0)), RZ(-a)), "Gold") for i, a in enumerate([-0.6, -0.3, 0, 0.3, 0.6])],
    ], "Head")
    # Göktürk kağanı: Kül Tigin başındaki gibi önünde kanatlarını açmış kuş olan taç; sırtta kurt başlı tuğ
    join("KulTiginTac", [
        solid("kt1", torus(0.104, 0.015, HAT + Vector((0, 0.01, -0.02)), RX(-0.05)), "Gold", True),
        solid("kt2", box(0.08, 0.012, 0.13, HAT + Vector((0, -0.105, 0.05)), RX(-0.2)), "Gold"),
        solid("kt3", box(0.05, 0.012, 0.09, HAT + Vector((0.085, -0.06, 0.03)), RZ(-0.9) @ RX(-0.2)), "Gold"),
        solid("kt4", box(0.05, 0.012, 0.09, HAT + Vector((-0.085, -0.06, 0.03)), RZ(0.9) @ RX(-0.2)), "Gold"),
        solid("kt5", ball(1, HAT + Vector((0, -0.125, 0.13)), (0.018, 0.018, 0.03)), "GoldDark", True),
        solid("kt6", box(0.2, 0.01, 0.035, HAT + Vector((0, -0.125, 0.14)), RY(0.0)), "GoldDark"),
        solid("kt7", cyl(0.01, 0.0, 0.03, 4, HAT + Vector((0, -0.145, 0.16)), RX(math.pi / 2)), "Gold"),
    ], "Head")
    TUG = Vector((-0.2, 0.22, 1.2))
    join("Tug", [
        solid("tg1", cyl(0.013, 0.013, 1.5, 8, TUG + Vector((0, 0, 0.45))), "Wood"),
        solid("tg2", cyl(0.07, 0.01, 0.35, 10, TUG + Vector((0, 0, 1.0))), "Black", True),
        solid("tg3", ball(1, TUG + Vector((0, 0, 1.25)), (0.05, 0.06, 0.055)), "Gold", True),
        solid("tg4", ball(1, TUG + Vector((0, -0.07, 1.24)), (0.03, 0.06, 0.03)), "Gold", True),
        solid("tg5", cyl(0.012, 0.0, 0.05, 4, TUG + Vector((0.025, 0.0, 1.31))), "Gold"),
        solid("tg6", cyl(0.012, 0.0, 0.05, 4, TUG + Vector((-0.025, 0.0, 1.31))), "Gold"),
    ], "spine_03")


# ---------- Yiğit kartlarının kostüm parçaları (kostum/BLENDER.md): C_ adlı, varsayılan gizli; yigit.js DETAY'da açılır ----------
# Bel elipsi (T-poz, ön -Y): merkez y, yarıçaplar; kaftan kabuğu 0.016 dışarıda
WAIST = (0.021, 0.157, 0.126)


def band(z0, z1, grow, seg=32, t=0.012):
    # bel çevresinde elips kuşak şeridi (kalınlıklı)
    cy, rx, ry = WAIST
    def f(bm):
        lo, hi = [], []
        for i in range(seg):
            a = math.tau * i / seg
            x, y = (rx + grow) * math.sin(a), cy - (ry + grow) * math.cos(a)
            lo.append(bm.verts.new((x, y, z0)))
            hi.append(bm.verts.new((x, y, z1)))
        faces = [bm.faces.new((lo[i], lo[(i + 1) % seg], hi[(i + 1) % seg], hi[i])) for i in range(seg)]
        bmesh.ops.recalc_face_normals(bm, faces=faces)
        bmesh.ops.solidify(bm, geom=faces, thickness=t)
    return f


def on_waist(a, grow, z):
    # bel elipsinde a açısındaki nokta (a=0 ön, +a sol yana)
    cy, rx, ry = WAIST
    return Vector(((rx + grow) * math.sin(a), cy - (ry + grow) * math.cos(a), z))


def chain(pts, r0, r1, flat=1.0):
    # örgü: noktalar boyunca incelen boğumlar
    def f(bm):
        n = len(pts)
        for i, p in enumerate(pts):
            r = r0 + (r1 - r0) * i / max(1, n - 1)
            res = bmesh.ops.create_uvsphere(bm, u_segments=8, v_segments=5, radius=r)
            bmesh.ops.scale(bm, vec=(1, flat, 1.35), verts=res["verts"])
            bmesh.ops.translate(bm, verts=res["verts"], vec=Vector(p))
    return f


def sheet(w0, w1, length, cols, rows, curve, back, t=0.01, wave=0.0):
    # asılı kumaş: üst kenar orijinde (menteşe), aşağı sarkar; yanlar öne doğru kıvrılır, alt kenar dalgalı
    def f(bm):
        grid = []
        for r in range(rows + 1):
            v = r / rows
            w = w0 + (w1 - w0) * v
            row = []
            for c in range(cols + 1):
                u = c / cols - 0.5
                x = u * w
                y = back * v - curve * (2 * u) ** 2
                z = -length * v + (wave * math.sin(u * 14) if r == rows else 0)
                row.append(bm.verts.new((x, y, z)))
            grid.append(row)
        faces = [bm.faces.new((grid[r][c], grid[r][c + 1], grid[r + 1][c + 1], grid[r + 1][c])) for r in range(rows) for c in range(cols)]
        bmesh.ops.solidify(bm, geom=faces, thickness=t)
    return f


def moved(build, at, rot=None):
    def f(bm):
        build(bm)
        if rot:
            bmesh.ops.rotate(bm, verts=bm.verts, matrix=rot)
        bmesh.ops.translate(bm, verts=bm.verts, vec=Vector(at))
    return f


def sway_part(name, parts, bone, hinge):
    # Sallanan parça: orijin menteşede; araya dünyaya hizalı bir boşluk (Piv_) konur ki oyunda yerel X ekseni sağ-sol olsun
    bpy.ops.object.select_all(action="DESELECT")
    for p in parts:
        p.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    ob = parts[0]
    ob.name = ob.data.name = name
    ob.data.transform(Matrix.Translation(-hinge))
    piv = bpy.data.objects.new("Piv" + name[1:].replace("_Sway", ""), None)
    S["coll"].objects.link(piv)
    piv.parent = S["arm"]
    piv.parent_type = "BONE"
    piv.parent_bone = bone
    piv.matrix_world = Matrix.Translation(hinge)
    ob.parent = piv
    ob.matrix_world = Matrix.Translation(hinge)
    return ob


def c_parts(HAT):
    # 1 Türk kemer takımı: deri kemer, altın levhalar, iki yanda sarkan kayış
    belt = [solid("cb0", band(1.03, 1.078, 0.045), "Leather")]
    for i, a in enumerate([-1.3, -0.75, -0.3, 0.3, 0.75, 1.3]):
        belt.append(solid(f"cb{i + 1}", box(0.036, 0.012, 0.04, on_waist(a, 0.058, 1.054), RZ(a)), "Gold"))
    belt.append(solid("cbk", box(0.06, 0.016, 0.056, on_waist(0, 0.06, 1.054)), "Gold"))  # toka
    for s in (-1, 1):
        a = s * 1.0
        belt.append(solid(f"cbs{s}", box(0.026, 0.008, 0.2, on_waist(a, 0.058, 0.94), RZ(a)), "Leather"))
        belt.append(solid(f"cbt{s}", box(0.03, 0.012, 0.03, on_waist(a, 0.062, 0.845), RZ(a)), "Gold"))
    join("C_Belt", belt, "pelvis")

    # 2 kuşak: bele iki tur sarılmış kumaş, önde düğüm ve iki sarkan uç
    sash = [solid("cs0", band(0.975, 1.1, 0.036, t=0.016), "Sash", True),
            solid("cs1", band(1.02, 1.055, 0.052, t=0.01), "Sash", True)]
    knot = on_waist(-0.35, 0.06, 1.035)
    sash.append(solid("cs2", ball(1, knot, (0.035, 0.028, 0.03)), "Sash", True))
    for i, (dx, ang) in enumerate([(-0.015, 0.12), (0.02, -0.08)]):
        sash.append(solid(f"cs{i + 3}", box(0.05, 0.012, 0.26, knot + Vector((dx, -0.01, -0.14)), RZ(-0.35) @ RY(ang)), "Sash"))
    join("C_Sash", sash, "pelvis")

    # 3 pelerin: omuzdan diz üstüne, alt kenar dalgalı, omuz uçlarında altın toka
    CAPE = Vector((0, 0.19, 1.47))
    cape = [solid("cc0", moved(sheet(0.44, 0.66, 0.92, 10, 12, 0.05, 0.07, wave=0.02), CAPE), "Cape", True)]
    for s in (-1, 1):
        cape.append(solid(f"cc{s}", cyl(0.03, 0.03, 0.012, 12, CAPE + Vector((s * 0.2, -0.05, 0.0)), RX(math.pi / 2)), "Gold"))
    sway_part("C_Cape_Sway", cape, "spine_03", CAPE)

    # 4 uzun kaftan eteği: belden diz altına genişleyen etek, önü açık, yanlarda yırtmaç, kenarı altın.
    # Deri gibi deforme olur: üstte pelvis, aşağı indikçe o taraftaki uyluk (bacaklar kaftanın içinden çıkmaz)
    cy, rx, ry = WAIST
    seg, rows, gap = 36, 8, 0.16
    me = bpy.data.meshes.new("meKaftanLong")
    bm = bmesh.new()
    grid = []
    for r in range(rows + 1):
        t = r / rows
        z = 1.0 - t * 0.6
        grow = 0.05 + t * 0.13
        row = []
        for i in range(seg + 1):
            a = gap + (math.tau - 2 * gap) * i / seg  # a=0 ön (açık)
            row.append(bm.verts.new(on_waist(a, grow, z)))
        grid.append(row)
    mid = lambda i: gap + (math.tau - 2 * gap) * (i + 0.5) / seg
    slit = lambda i: min(abs(mid(i) - math.pi / 2), abs(mid(i) - 3 * math.pi / 2)) < 0.1
    for r in range(rows):
        for i in range(seg):
            if r >= rows // 2 and slit(i):
                continue  # at binmek için yan yırtmaç
            f = bm.faces.new((grid[r][i], grid[r + 1][i], grid[r + 1][i + 1], grid[r][i + 1]))
            f.material_index = 1 if (r == rows - 1 or i in (0, seg - 1)) else 0
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bmesh.ops.solidify(bm, geom=list(bm.faces), thickness=0.012)
    bm.to_mesh(me)
    bm.free()
    me.materials.append(S["M"]["Kaftan"])
    me.materials.append(S["M"]["Gold"])
    sk = bpy.data.objects.new("C_KaftanLong", me)
    S["coll"].objects.link(sk)
    sk.parent = S["arm"]
    groups = {n: sk.vertex_groups.new(name=n) for n in ("pelvis", "thigh_l", "thigh_r")}
    for v in me.vertices:
        t = min(1, max(0, (1.0 - v.co.z) / 0.6))
        side = min(1, max(0, 0.5 + v.co.x / 0.16))  # +x sol bacak
        groups["pelvis"].add([v.index], 1 - t, "REPLACE")
        if t > 0:
            groups["thigh_l"].add([v.index], t * side, "REPLACE")
            groups["thigh_r"].add([v.index], t * (1 - side), "REPLACE")
    mod = sk.modifiers.new("Armature", "ARMATURE")
    mod.object = S["arm"]

    # 5 kürk yaka: omuzlara taşan kalın, yumrulu kürk
    def fur(bm):
        seg, cy = 28, 0.035
        rings = []
        for i in range(seg):
            a = math.tau * i / seg
            cx_, cy_ = 0.2 * math.sin(a), cy - 0.14 * math.cos(a)
            out = Vector((math.sin(a), -math.cos(a), 0))
            rr = 0.055 + 0.012 * math.sin(a * 7)
            rings.append([bm.verts.new(Vector((cx_, cy_, 1.47)) + out * math.cos(b) * rr * 1.25 + Vector((0, 0, math.sin(b) * rr)))
                          for b in (math.tau * j / 8 for j in range(8))])
        for i in range(seg):
            for j in range(8):
                bm.faces.new((rings[i][j], rings[i][(j + 1) % 8], rings[(i + 1) % seg][(j + 1) % 8], rings[(i + 1) % seg][j]))
    join("C_FurCollar", [solid("cf0", fur, "Kurk", True)], "spine_03")

    # 6 uzun bıyık: uçları çeneye sarkar
    join("C_Mustache", [
        solid(f"cm{s}", horn(0.085, 0.011, -0.04, Vector((s * 0.012, -0.112, 1.603)), RY(s * 1.87)), "Black", True) for s in (-1, 1)
    ] + [solid(f"cmt{s}", horn(0.05, 0.006, 0.0, Vector((s * 0.092, -0.075, 1.58)), RY(s * 2.7)), "Black", True) for s in (-1, 1)], "Head")

    # 7 enseden sırta inen tek kalın örgü, ucunda altın halka
    BR = Vector((0, 0.1, 1.63))
    pts = [BR + Vector((0, 0.02 + 0.024 * i, -0.055 * i)) for i in range(8)]  # pelerinin üstünden iner
    sway_part("C_BraidBack_Sway", [
        solid("cr0", chain(pts, 0.03, 0.02, 0.8), "Black", True),
        solid("cr1", torus(0.02, 0.006, pts[-1] + Vector((0, 0, -0.035)), RX(0)), "Gold", True),
        solid("cr2", cyl(0.012, 0.004, 0.06, 6, pts[-1] + Vector((0, 0, -0.07))), "Black"),
    ], "Head", BR)

    # 8 pul zırh göğüslük: yatay sıra sıra dikdörtgen levhalar, aralarında deri bağ
    def lamel(c):
        if c.z < 1.1 or c.z > 1.46 or abs(c.x) > 0.22:
            return None
        row = (c.z - 1.1) / 0.045
        if row % 1 < 0.2:
            return "Leather"
        return "GoldDark" if row % 1 < 0.28 else "Iron"  # koyu demir levha bantları, aralarda altın bağ
    shell("C_Lamellar", {"torso"}, 0.034, lamel)

    # 9 kulakların önünden göğse inen iki ince örgü
    join("C_BraidsSide", [
        solid(f"cbs{s}", chain([Vector((s * (0.088 + 0.004 * i), -0.03 - 0.012 * i, 1.64 - 0.04 * i)) for i in range(7)], 0.016, 0.011), "Black", True)
        for s in (-1, 1)], "Head")

    # 10 üç katlı levha omuzluk: omuz kabuğu, katlar kol boyunca dışa kayar (kol kemikleriyle deforme olur)
    tiers = []
    for k, (x0, x1, off) in enumerate([(0.19, 0.29, 0.06), (0.26, 0.35, 0.05), (0.32, 0.41, 0.04)]):
        tiers.append(shell(f"cp{k}", {"arm", "torso"}, off,
                           lambda c, x0=x0, x1=x1: ("Gold" if abs(c.x) > x1 - 0.015 else "Steel") if x0 < abs(c.x) < x1 and c.z > 1.43 else None))
    bpy.ops.object.select_all(action="DESELECT")
    for t in tiers:
        t.select_set(True)
    bpy.context.view_layer.objects.active = tiers[0]
    bpy.ops.object.join()
    tiers[0].name = tiers[0].data.name = "C_Pauldrons"

    # 11 göğse inen uzun sakal (kara ve ak)
    def beard(name, m):
        join(name, [
            solid(name + "0", moved(cyl(0.018, 0.075, 0.26, 12), (0, 0, 0), RX(-0.35)), m, True),
            solid(name + "1", ball(1, (0, -0.012, 0.12), (0.075, 0.05, 0.06)), m, True),
        ], "Head")
        ob = bpy.data.objects[name]
        ob.data.transform(Matrix.Translation(Vector((0, -0.135, 1.45))) @ Matrix.Diagonal((1, 0.55, 1, 1)))
    beard("C_BeardLong", "Black")
    beard("C_BeardLongWhite", "Bone")

    # 12 şaman saçakları: belden dize renkli şeritler, uçlarında demir çıngırak (yalnız yan ve arka: koşarken bacağa girmesin)
    FR = Vector((0, WAIST[0], 1.0))
    fr = []
    for i in range(13):
        a = 1.0 + (math.tau - 2.0) * i / 12
        p = on_waist(a, 0.06, 0.99)
        ln = 0.38 + 0.05 * (i % 3)
        fr.append(solid(f"cfr{i}", box(0.035, 0.006, ln, p + Vector((0, 0, -ln / 2)), RZ(a)), ["Cloth", "Blood", "Jade", "Straw"][i % 4]))
        fr.append(solid(f"cfb{i}", cyl(0.014, 0.022, 0.035, 6, p + Vector((0, 0, -ln - 0.01))), "Iron"))
    sway_part("C_Fringe_Sway", fr, "pelvis", FR)

    # 13 göğüste bronz ayna (küzüngü)
    MIR = Vector((0, -0.16, 1.33))
    join("C_ShamanMirror", [
        solid("cmr0", cyl(0.07, 0.07, 0.012, 20, MIR, RX(math.pi / 2)), "Gold"),
        solid("cmr1", torus(0.07, 0.008, MIR, RX(math.pi / 2), seg=20), "GoldDark", True),
        solid("cmr2", cyl(0.018, 0.018, 0.016, 10, MIR + Vector((0, -0.004, 0)), RX(math.pi / 2)), "GoldDark"),
    ], "spine_03")

    # 14 sırtta tek yüzlü şaman davulu (tüngür): deri yüz, ahşap çember
    DR = Vector((0.03, 0.27, 1.22))
    join("C_Drum", [
        solid("cd0", cyl(0.2, 0.2, 0.012, 24, DR + Vector((0, 0.03, 0)), RX(math.pi / 2)), "Leather"),
        solid("cd1", torus(0.2, 0.028, DR, RX(math.pi / 2), seg=24), "Wood", True),
        solid("cd2", cyl(0.006, 0.006, 0.4, 6, DR, RZ(0.0) @ RY(math.pi / 2)), "Wood"),
    ], "spine_03")
    # İç ağ adları C_/Sway taşımasın: oyun çok renkli parçayı alt ağlara böler ve adlarını ağdan alır (C_Cape_Sway_1 ayrı parça sanılırdı)
    for o in bpy.data.objects:
        if o.name.startswith("C_") and o.type == "MESH":
            o.data.name = "me" + o.name[1:].replace("_Sway", "")


WEP = A + "acik/silahlar/FBX/"


def opaque(ob):
    # Quaternius FBX malzemeleri Blender'a saydamlık 0 ile gelir: görünür yap
    for m in ob.data.materials:
        b = m.node_tree.nodes.get("Principled BSDF") if m and m.use_nodes else None
        if b:
            b.inputs["Alpha"].default_value = 1.0
        if hasattr(m, "surface_render_method"):
            m.surface_render_method = "DITHERED"
        if hasattr(m, "blend_method"):
            m.blend_method = "OPAQUE"


def weapon(name, length, grip=0.15, spin=0.0):
    # Quaternius silah paketinden: boyu `length` m olur, kabza orijinde, bıçak/uç +Y yönünde (kendi silahlarımızla aynı düzen)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=WEP + name + ".fbx")
    new = set(bpy.data.objects) - before
    ob = [o for o in new if o.type == "MESH"][0]
    for o in new:
        if o != ob:
            bpy.data.objects.remove(o, do_unlink=True)
    mw = ob.matrix_world.copy()  # ebeveynin (FBX kökü) dönüş ve ölçeği dahil
    ob.parent = None
    ob.data.transform(mw)
    ob.matrix_world = Matrix.Identity(4)
    zs = [v.co.z for v in ob.data.vertices]
    L = max(zs) - min(zs)
    ob.data.transform(RZ(spin).to_4x4() @ RX(-math.pi / 2).to_4x4() @ Matrix.Scale(length / L, 4) @ Matrix.Translation((0, 0, -(min(zs) + L * grip))))
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    S["coll"].objects.link(ob)
    opaque(ob)
    return ob


def shield_mesh(name, diameter):
    # kalkan: disk XZ düzleminde; ön yüzü -Y (ileri) bakar, merkez orijinde
    before = set(bpy.data.objects)
    bpy.ops.import_scene.fbx(filepath=WEP + name + ".fbx")
    new = set(bpy.data.objects) - before
    ob = [o for o in new if o.type == "MESH"][0]
    for o in new:
        if o != ob:
            bpy.data.objects.remove(o, do_unlink=True)
    mw = ob.matrix_world.copy()  # ebeveynin (FBX kökü) dönüş ve ölçeği dahil
    ob.parent = None
    ob.data.transform(mw)
    ob.matrix_world = Matrix.Identity(4)
    ob.data.transform(RZ(math.pi).to_4x4() @ Matrix.Scale(diameter / 2, 4))
    for c in list(ob.users_collection):
        c.objects.unlink(ob)
    S["coll"].objects.link(ob)
    opaque(ob)
    return ob


def build_kormos():
    # Erlik Han'ın kulu: kara zırh, kan kırmızı şeritler, boynuzlu demir miğfer, balta
    setup([])

    def armor(c):
        if abs(c.x) > 0.62 or (c.z > 1.47 and abs(c.x) < 0.2):
            return "Blood"
        if 1.0 < c.z < 1.08 and abs(c.x) < 0.3:
            return "Iron"
        if c.z < 1.0:
            return "Dark"
        return "Iron" if abs(c.x) > 0.3 else "Dark"

    shell("Armor", {"torso", "arm"}, 0.016, armor)
    shell("Legs", {"leg"}, 0.009, lambda c: "Dark")
    shell("Boots", {"boot"}, 0.014, lambda c: "Iron" if c.z > 0.5 else "Black", drop_toes)
    boot_feet("Black")
    hide_skin({"torso", "arm", "leg", "boot"})
    HAT = Vector((0, 0.02, 1.7))
    join("Helmet", [
        solid("h1", ball(1, HAT, (0.118, 0.125, 0.14), cut=-0.1), "Iron", True),
        solid("h2", torus(0.118, 0.015, HAT + Vector((0, 0, -0.005)), RX(0)), "Blood", True),
        solid("h3", box(0.02, 0.03, 0.09, HAT + Vector((0, -0.125, -0.03))), "Iron"),  # burun siperi
        solid("h4", horn(0.2, 0.035, 0.12, HAT + Vector((-0.1, 0, 0.06)), RY(-1.0)), "Bone", True),
        solid("h5", horn(0.2, 0.035, 0.12, HAT + Vector((0.1, 0, 0.06)), RY(1.0)), "Bone", True),
    ], "Head")

    def axe_head(bm):
        pts = [(0, 0.5, 0), (-0.02, 0.62, 0), (-0.16, 0.7, 0), (-0.2, 0.58, 0), (-0.16, 0.44, 0), (-0.02, 0.5, 0)]
        f = bm.faces.new([bm.verts.new(p) for p in pts])
        bmesh.ops.solidify(bm, geom=[f], thickness=0.02)

    def shield(bm):
        bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.3, radius2=0.26, depth=0.05)
    SH = Vector((0.55, -0.12, 1.44))  # sol ön kolun dışı (T-poz)
    join("Shield", place([shield_mesh("Shield_Round_2", 0.66)], SH, RX(0)), "lowerarm_l")
    join("Spear", place([weapon("Spear", 1.7, 0.25)], HAND_R, RZ(math.pi)), "hand_r")
    join("Axe", place([weapon("Axe", 0.85, 0.12)], HAND_R, RZ(math.pi)), "hand_r")
    finish("kormos", [("attack", "Sword_Attack", 12)])


def build_tepegoz():
    # Dede Korkut'un tek gözlü devi: kürk peştamal ve omuzluk, alnında tek göz, dev topuz
    setup(["Hair_Long"])
    eyes = bpy.data.objects["Eyes"]
    ec = sum((eyes.matrix_world @ v.co for v in eyes.data.vertices), Vector()) / len(eyes.data.vertices)
    ey = min((eyes.matrix_world @ v.co).y for v in eyes.data.vertices)
    print("EYES", ec, ey)
    for n in ("Eyes", "Eyebrows"):
        bpy.data.objects.remove(bpy.data.objects[n])
    shell("Loin", {"torso", "leg"}, 0.02, lambda c: ("DarkFur" if c.z > 1.0 else "Fur") if 0.72 < c.z < 1.06 else None)
    shell("Mantle", {"torso", "arm"}, 0.03, lambda c: "Fur" if c.z > 1.36 and abs(c.x) < 0.36 else None)
    shell("Wraps", {"boot"}, 0.012, lambda c: "Leather" if 0.2 < c.z < 0.45 else None)
    EYE = Vector((0, ey + 0.04, ec.z + 0.095))
    join("Brow", [  # yüzünde göz yok: göz çukurlarını kalın kaş kemiği örter (Dede Korkut: tepesinde tek göz)
        solid("br1", ball(1, Vector((0, ey + 0.012, ec.z)), (0.085, 0.035, 0.03)), "TepeSkin", True),
        solid("br2", box(0.16, 0.02, 0.012, Vector((0, ey - 0.012, ec.z + 0.005))), "BloodDark"),
    ], "Head")
    join("Eye", [
        solid("e1", ball(0.066, EYE, (1, 0.8, 1)), "EyeWhite", True),
        solid("e2", ball(0.034, EYE + Vector((0, -0.04, 0.004)), (1, 0.5, 1)), "Iris", True),
        solid("e3", ball(0.016, EYE + Vector((0, -0.058, 0.004)), (1, 0.5, 1)), "Black", True),
        solid("e4", torus(0.07, 0.013, EYE + Vector((0, 0.005, 0)), RX(math.pi / 2 - 0.3)), "Blood", True),  # göz kapağı kızarıklığı
    ], "Head")

    def studs(bm):
        for i in range(10):
            a = i * 2.4
            y = 0.55 + (i % 5) * 0.08
            bmesh.ops.create_cone(bm, cap_ends=True, segments=4, radius1=0.022, radius2=0.0, depth=0.05,
                                  matrix=Matrix.Translation((math.cos(a) * 0.075, y, math.sin(a) * 0.075)) @ Matrix.Rotation(a, 4, "Y") @ RX(-math.pi / 2).to_4x4() @ Matrix.Rotation(math.pi / 2, 4, "Z"))

    join("Club", place([
        solid("c1", cyl(0.028, 0.08, 0.95, 10, (0, 0.38, 0), RX(-math.pi / 2)), "Wood", True),
        solid("c2", studs, "Iron"),
    ], HAND_R, RZ(math.pi)), "hand_r")
    finish("tepegoz", [("punch", "Punch_Cross", 10)])


# ---------- önizleme + dışa aktarma ----------
def clean_textures():
    # Toon gölgelendirmede sadece renk dokusu kullanılır; normal/pürüzlülük haritaları dosyayı şişirir.
    for m in bpy.data.materials:
        if not m.use_nodes:
            continue
        nt = m.node_tree
        bsdf = nt.nodes.get("Principled BSDF")
        if not bsdf:
            continue
        for inp in ("Normal", "Roughness", "Metallic"):
            for l in list(bsdf.inputs[inp].links):
                nt.links.remove(l)
        for n in list(nt.nodes):
            if n.type == "NORMAL_MAP" or (n.type == "TEX_IMAGE" and not any(o.links for o in n.outputs)):
                nt.nodes.remove(n)
    for img in bpy.data.images:
        if img.size[0] > 1024:
            img.scale(1024, 1024)


def preview(tag, action, frame):
    scene, arm = bpy.context.scene, S["arm"]
    if action:
        arm.animation_data_create()
        arm.animation_data.action = bpy.data.actions[action]
        slots = getattr(arm.animation_data, "action_suitable_slots", None)
        if slots:
            arm.animation_data.action_slot = slots[0]
        scene.frame_set(frame)
    elif arm.animation_data:
        arm.animation_data.action = None
    scene.render.engine = "BLENDER_EEVEE"
    if not bpy.data.objects.get("PrevSun"):
        sun = bpy.data.objects.new("PrevSun", bpy.data.lights.new("PrevSun", "SUN"))
        sun.data.energy = 4
        sun.rotation_euler = (0.9, 0.3, -0.6)
        scene.collection.objects.link(sun)
        scene.world = bpy.data.worlds.new("W")
        scene.world.color = (0.45, 0.48, 0.55)
    scene.render.resolution_x = scene.render.resolution_y = 700
    cam = bpy.data.objects.get("PrevCam")
    if not cam:
        cam = bpy.data.objects.new("PrevCam", bpy.data.cameras.new("PrevCam"))
        scene.collection.objects.link(cam)
    for n, pos in [("front", (1.2, -3.2, 1.3)), ("back", (-1.0, 3.2, 1.5))]:
        cam.location = pos
        cam.rotation_euler = (Vector((0, 0, 0.95)) - Vector(pos)).to_track_quat("-Z", "Y").to_euler()
        scene.camera = cam
        scene.render.filepath = os.path.join(TOOLS, f"preview_{tag}_{n}.png")
        bpy.ops.render.render(write_still=True)


def finish(name, previews):
    clean_textures()
    keep = set(S["coll"].objects)
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=UAL)
    for o in set(bpy.data.objects) - before:
        if o.type == "ARMATURE":
            o.hide_render = True
        else:
            bpy.data.objects.remove(o)
    preview(name + "_tpose", None, 1)
    for tag, act, fr in previews:
        preview(f"{name}_{tag}", act, fr)
    S["arm"].animation_data.action = None
    bpy.ops.object.select_all(action="DESELECT")
    for o in keep:
        o.select_set(True)
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, name + ".glb"), use_selection=True, export_animations=False,
                              export_apply=False, export_skins=True, export_image_format="WEBP")
    print("EXPORTED", name)


def author_clips(rig):
    # Hazır paketlerde olmayan klipler: dünya uzayında "dinlenme duruşuna göre dönüş" anahtarları ile yazılır.
    # Karakter -Y'ye bakar; sol = +X. Rz(-90°) sol kolu, Rz(+90°) sağ kolu ileri çevirir.
    scene = bpy.context.scene
    bpy.context.view_layer.objects.active = rig
    W = rig.matrix_world.to_3x3().normalized()
    Wi = W.inverted()
    pbs = rig.pose.bones
    for pb in pbs:
        pb.rotation_mode = "QUATERNION"
    order = [pb.name for pb in pbs]  # ebeveyn önce gelir

    def base_pose(action, frame):
        rig.animation_data_create()
        rig.animation_data.action = bpy.data.actions[action]
        slots = getattr(rig.animation_data, "action_suitable_slots", None)
        if slots:
            rig.animation_data.action_slot = slots[0]
        scene.frame_set(frame)
        basis = {pb.name: pb.matrix_basis.copy() for pb in pbs}
        rig.animation_data.action = None
        for pb in pbs:
            pb.matrix_basis = basis[pb.name]
        bpy.context.view_layer.update()

    def aim(rots):
        for name in order:
            if name not in rots:
                continue
            pb = pbs[name]
            rest = pb.bone.matrix_local.to_3x3()
            tgt = Wi @ rots[name] @ W @ rest
            pb.matrix = Matrix.Translation(pb.matrix.translation) @ tgt.to_4x4()
            bpy.context.view_layer.update()

    def clip(name, keys, base, base_frame=0):
        frames = []
        for f, rots in keys:
            base_pose(base, base_frame)
            aim(rots)
            frames.append((f, {pb.name: pb.rotation_quaternion.copy() for pb in pbs}))
        act = bpy.data.actions.new(name)
        rig.animation_data.action = act
        for f, qs in frames:
            for pb in pbs:
                pb.rotation_quaternion = qs[pb.name]
                pb.keyframe_insert("rotation_quaternion", frame=f)
        rig.animation_data.action = None
        print("AUTHORED", name)

    Rz = lambda d: Matrix.Rotation(math.radians(d), 3, "Z")
    Rx = lambda d: Matrix.Rotation(math.radians(d), 3, "X")
    Ry = lambda d: Matrix.Rotation(math.radians(d), 3, "Y")
    # Yay: sol kol ileri, sağ el kirişi çeneye çeker, bırakınca geri savrulur
    draw = {"upperarm_l": Rz(-82), "lowerarm_l": Rz(-86), "hand_l": Rz(-86),
            "upperarm_r": Rz(-40) @ Rx(-8), "lowerarm_r": Rz(128), "hand_r": Rz(128)}
    raise_ = {"upperarm_l": Rz(-75) @ Ry(25), "lowerarm_l": Rz(-80), "hand_l": Rz(-80),
              "upperarm_r": Rz(40), "lowerarm_r": Rz(100), "hand_r": Rz(100)}
    loose = dict(draw, lowerarm_r=Rz(-20), hand_r=Rz(-10), upperarm_r=Rz(-50) @ Rx(-5))
    clip("Bow_Shoot", [(0, {}), (4, raise_), (9, draw), (13, draw), (15, loose), (22, loose), (30, {})], "Sprint_Loop", 4)
    # Kılıç saplama: sağ kol ileri uzanır, bilek bükülür, kılıç ileri
    cock = {"spine_03": Rz(25), "upperarm_r": Rz(-30) @ Rx(-20), "lowerarm_r": Rz(150), "hand_r": Rz(60) @ Ry(-60)}
    thrust = {"spine_03": Rz(-25), "upperarm_r": Rz(88) @ Rx(-6), "lowerarm_r": Rz(90) @ Rx(-4), "hand_r": Ry(-72)}  # bilek aşağı bükük, bıçak ileri
    clip("Sword_Stab", [(0, {}), (5, cock), (9, thrust), (15, thrust), (24, {})], "Sword_Idle", 0)


# ---------- Mixamo animasyonlarını oyun iskeletine (UE mankeni) aktarma ----------
# İki iskelet de T-pozda: her kemiğin dünya uzayındaki dinlenme→poz dönüşü hedef kemiğe aynen uygulanır.
MXD = A + "animasyonlar/"
GS = A + "acik/Great Sword Pack/"
LB = A + "acik/Pro Longbow Pack/"
MX_MAP = {"Hips": "pelvis", "Spine": "spine_01", "Spine1": "spine_02", "Spine2": "spine_03", "Neck": "neck_01", "Head": "Head"}
for _side, _s in (("Left", "l"), ("Right", "r")):
    MX_MAP.update({f"{_side}Shoulder": f"clavicle_{_s}", f"{_side}Arm": f"upperarm_{_s}", f"{_side}ForeArm": f"lowerarm_{_s}",
                   f"{_side}Hand": f"hand_{_s}", f"{_side}UpLeg": f"thigh_{_s}", f"{_side}Leg": f"calf_{_s}",
                   f"{_side}Foot": f"foot_{_s}", f"{_side}ToeBase": f"ball_{_s}"})
    for _mx, _ue in (("Thumb", "thumb"), ("Index", "index"), ("Middle", "middle"), ("Ring", "ring"), ("Pinky", "pinky")):
        for _i in (1, 2, 3):
            MX_MAP[f"{_side}Hand{_mx}{_i}"] = f"{_ue}_0{_i}_{_s}"

# (klip adı, dosya, kalça yüksekliği korunsun mu) — kalçanın ileri/yana kayması hep sıfırlanır (yerinde oynar)
MIXAMO = [
    ("MX_FastRun", MXD + "Fast Run.fbx", True), ("MX_Run", MXD + "Run.fbx", True), ("MX_Running", MXD + "Running.fbx", True),
    ("MX_RunUnarmed", MXD + "Unarmed Run Forward.fbx", True), ("MX_FrontFlip", MXD + "Front Flip.fbx", False),
    ("MX_TwistFlip", MXD + "Front Twist Flip.fbx", False), ("MX_Stab1", MXD + "Stabbing.fbx", True),
    ("MX_Stab2", MXD + "Stabbing (1).fbx", True), ("MX_Stab3", MXD + "Stabbing (2).fbx", True),
    ("MX_BowDraw", MXD + "Standing Draw Arrow.fbx", True), ("MX_BowEquip", MXD + "Standing Equip Bow.fbx", True),
    ("MX_GS_Draw", GS + "draw a great sword 1.fbx", True), ("MX_GS_Attack", GS + "great sword attack.fbx", True),
    ("MX_GS_Block", GS + "great sword blocking.fbx", True), ("MX_GS_Cast", GS + "great sword casting.fbx", True),
    ("MX_GS_Crouch", GS + "great sword crouching.fbx", True), ("MX_GS_Spin", GS + "great sword high spin attack.fbx", True),
    ("MX_GS_Idle", GS + "great sword idle.fbx", True), ("MX_GS_Idle2", GS + "great sword idle (2).fbx", True),
    ("MX_GS_Idle3", GS + "great sword idle (3).fbx", True), ("MX_GS_Impact", GS + "great sword impact.fbx", True),
    ("MX_GS_Impact2", GS + "great sword impact (2).fbx", True), ("MX_GS_Jump", GS + "great sword jump.fbx", False),
    ("MX_GS_JumpAttack", GS + "great sword jump attack.fbx", True), ("MX_GS_Kick", GS + "great sword kick.fbx", True),
    ("MX_GS_PowerUp", GS + "great sword power up.fbx", True), ("MX_GS_Run", GS + "great sword run.fbx", True),
    ("MX_GS_Run2", GS + "great sword run (2).fbx", True), ("MX_GS_Slash1", GS + "great sword slash.fbx", True),
    ("MX_GS_Slash2", GS + "great sword slash (2).fbx", True), ("MX_GS_Slash3", GS + "great sword slash (3).fbx", True),
    ("MX_GS_Slash4", GS + "great sword slash (4).fbx", True), ("MX_GS_Slash5", GS + "great sword slash (5).fbx", True),
    ("MX_GS_Slide", GS + "great sword slide attack.fbx", True), ("MX_GS_Strafe", GS + "great sword strafe.fbx", True),
    ("MX_GS_Walk", GS + "great sword walk.fbx", True), ("MX_Cast", GS + "spell cast.fbx", True),
    ("MX_Death1", GS + "two handed sword death.fbx", True), ("MX_Death2", GS + "two handed sword death (2).fbx", True),
    ("MX_BowRecoil", LB + "standing aim recoil.fbx", True), ("MX_BowOverdraw", LB + "standing aim overdraw.fbx", True),
    ("MX_BowIdle", LB + "standing idle 01.fbx", True), ("MX_BowRun", LB + "standing run forward.fbx", True),
    ("MX_Dive", LB + "standing dive forward.fbx", True), ("MX_DodgeL", LB + "standing dodge left.fbx", True),
    ("MX_DodgeR", LB + "standing dodge right.fbx", True), ("MX_DeathBack", LB + "standing death backward 01.fbx", True),
    ("MX_DeathFwd", LB + "standing death forward 01.fbx", True), ("MX_React", LB + "standing react small from front.fbx", True),
    ("MX_Kick", LB + "standing melee kick.fbx", True), ("MX_Punch", LB + "standing melee punch.fbx", True),
    ("MX_BowBlock", LB + "standing block.fbx", True), ("MX_FallLoop", LB + "fall a loop.fbx", False),
    ("MX_Look", LB + "standing idle 02 looking.fbx", True), ("MX_Examine", LB + "standing idle 03 examine.fbx", True),
]


def retarget_mixamo(rig):
    scene = bpy.context.scene
    Wt = rig.matrix_world.to_quaternion()
    tb = list(rig.pose.bones)
    inv = {v: k for k, v in MX_MAP.items()}
    rel = {pb.name: ((pb.parent.bone.matrix_local.inverted() @ pb.bone.matrix_local) if pb.parent else pb.bone.matrix_local).to_quaternion() for pb in tb}
    rest_t = {pb.name: Wt @ pb.bone.matrix_local.to_quaternion() for pb in tb}
    pelvis_h = (rig.matrix_world @ rig.data.bones["pelvis"].matrix_local).translation.z
    pelvis_rest = rest_t["pelvis"]
    for pb in tb:
        pb.rotation_mode = "QUATERNION"
    for name, path, keep_y in MIXAMO:
        if not os.path.exists(path):
            print("YOK", path)
            continue
        objs0, acts0 = set(bpy.data.objects), set(bpy.data.actions)
        bpy.ops.import_scene.fbx(filepath=path)
        src = [o for o in set(bpy.data.objects) - objs0 if o.type == "ARMATURE"][0]
        act = src.animation_data.action
        f0, f1 = (int(round(v)) for v in act.frame_range)
        Ws = src.matrix_world
        rest_s = {mx: (Ws @ src.data.bones["mixamorig:" + mx].matrix_local).to_quaternion() for mx in MX_MAP}
        hips0 = (Ws @ src.data.bones["mixamorig:Hips"].matrix_local).translation.copy()
        k = pelvis_h / hips0.z
        frames, prev = [], {}
        for f in range(f0, f1 + 1):
            scene.frame_set(f)
            world, qs = {}, {}
            for pb in tb:
                pw = world[pb.parent.name] if pb.parent else Wt
                mx = inv.get(pb.name)
                if mx:
                    sp = (Ws @ src.pose.bones["mixamorig:" + mx].matrix).to_quaternion()
                    tw = sp @ rest_s[mx].inverted() @ rest_t[pb.name]
                else:
                    tw = pw @ rel[pb.name]
                world[pb.name] = tw
                q = (pw @ rel[pb.name]).inverted() @ tw
                if pb.name in prev and prev[pb.name].dot(q) < 0:
                    q.negate()  # dörtlü süreklilik: ara karelerde ters dönüş olmasın
                prev[pb.name] = q
                qs[pb.name] = q.copy()
            d = ((Ws @ src.pose.bones["mixamorig:Hips"].matrix).translation - hips0) * k
            d.x = d.y = 0.0
            if not keep_y:
                d.z = 0.0
            frames.append((f - f0, qs, pelvis_rest.inverted() @ d))
        # kaynak iskelet, örgü ve klipleri at
        for o in set(bpy.data.objects) - objs0:
            bpy.data.objects.remove(o, do_unlink=True)
        for a in set(bpy.data.actions) - acts0:
            bpy.data.actions.remove(a)
        out = bpy.data.actions.new(name)
        rig.animation_data_create()
        rig.animation_data.action = out
        for f, qs, loc in frames:
            fr = f * scene.render.fps / 30.0  # Mixamo 30 kare/sn
            for pb in tb:
                pb.rotation_quaternion = qs[pb.name]
                pb.keyframe_insert("rotation_quaternion", frame=fr)
            pbp = rig.pose.bones["pelvis"]
            pbp.location = loc
            pbp.keyframe_insert("location", frame=fr)
        rig.animation_data.action = None
        for pb in tb:
            pb.rotation_quaternion = (1, 0, 0, 0)
            pb.location = (0, 0, 0)
        print("MIXAMO", name, len(frames))


def build_anims():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=UAL)
    rig = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
    bpy.ops.import_scene.gltf(filepath=UAL2)  # aynı iskelet; sadece klipleri alınır
    for o in list(bpy.data.objects):
        if o != rig:
            bpy.data.objects.remove(o)
    for a in list(bpy.data.actions):
        if a.name not in ANIMS:
            bpy.data.actions.remove(a)
    author_clips(rig)
    retarget_mixamo(rig)
    rig.animation_data_create()
    for a in bpy.data.actions:
        tr = rig.animation_data.nla_tracks.new()
        tr.name = a.name
        st = tr.strips.new(a.name, int(a.frame_range[0]), a)
        if hasattr(st, "action_slot") and a.slots:
            st.action_slot = a.slots[0]
        tr.mute = True
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "anims.glb"), use_selection=True, export_animations=True,
                              export_animation_mode="NLA_TRACKS", export_skins=False)
    print("EXPORTED anims", sorted(a.name for a in bpy.data.actions))


def build_horse():
    # Quaternius atı: eyer + kilim örtü + koyu doru renkler. Oyunda 0.48 ölçeklenir.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=HORSE)
    bpy.data.objects.remove(bpy.data.objects["Icosphere"])
    arm = bpy.data.objects["AnimalArmature"]
    me = bpy.data.objects["Horse"]
    S.update(arm=arm, coll=me.users_collection[0])
    S["M"] = {k: mat("M_" + k, tuple(int(v[i:i + 2], 16) / 255 for i in (0, 2, 4))) for k, v in COLORS.items()}
    for name, hexc in {"Main": "5a3620", "Main_Dark": "2e1c10", "Main_Light": "8a6242", "Hair": "17120e"}.items():
        bsdf = bpy.data.materials[name].node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*[(int(hexc[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)], 1)
    # sırt yüksekliği: gövdenin ortasındaki en yüksek nokta
    top = max((me.matrix_world @ v.co).z for v in me.data.vertices if abs(v.co.x) < 0.25 and -0.6 < v.co.y < 0.4)
    print("SADDLE_TOP", top)
    SAD = Vector((0, -0.1, top))
    join("Saddle", [
        solid("sd1", box(1.25, 1.3, 0.08, SAD + Vector((0, 0, 0.0))), "Blood"),       # kilim örtü
        solid("sd2", box(1.3, 1.34, 0.05, SAD + Vector((0, 0, -0.03))), "Gold"),       # altın saçak
        solid("sd3", box(0.75, 0.95, 0.22, SAD + Vector((0, 0, 0.13))), "Leather"),    # eyer
        solid("sd4", box(0.7, 0.18, 0.28, SAD + Vector((0, -0.45, 0.22))), "Leather"), # ön kaş
        solid("sd5", box(0.7, 0.14, 0.2, SAD + Vector((0, 0.45, 0.18))), "Leather"),   # arka kaş
    ], "Torso")
    clean_textures()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "horse.glb"), use_selection=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_skins=True, export_image_format="WEBP")
    print("EXPORTED horse", sorted(a.name for a in bpy.data.actions))


def build_wolf():
    # Gök yeleli kurt: Oğuz'a yol gösteren bozkurt. Oyunda 0.34 ölçeklenir.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=WOLF)
    bpy.data.objects.remove(bpy.data.objects["Icosphere"])
    for name, hexc in {"Main": "6f7f96", "Main_Light": "c3d0e2"}.items():
        bsdf = bpy.data.materials[name].node_tree.nodes["Principled BSDF"]
        bsdf.inputs["Base Color"].default_value = (*[(int(hexc[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)], 1)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "wolf.glb"), use_selection=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_skins=True, export_image_format="WEBP")
    print("EXPORTED wolf", sorted(a.name for a in bpy.data.actions))


def build_stag():
    # Ak Geyik: gizli yola götüren bembeyaz geyik, altın boynuzlu. Oyunda 0.42 ölçeklenir.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=STAG)
    for o in list(bpy.data.objects):
        if o.name.startswith("Icosphere"):
            bpy.data.objects.remove(o)
    for m in bpy.data.materials:
        if not m.use_nodes or "Principled BSDF" not in m.node_tree.nodes:
            continue
        bsdf = m.node_tree.nodes["Principled BSDF"]
        r, g, b, _ = bsdf.inputs["Base Color"].default_value
        lum = 0.3 * r + 0.6 * g + 0.1 * b
        bsdf.inputs["Base Color"].default_value = (0.95, 0.94, 0.9, 1) if lum > 0.02 else (0.35, 0.3, 0.28, 1)
    for o in bpy.data.objects:
        if o.type == "MESH" and "Horn" in o.name:
            for slot in o.material_slots:
                slot.material = mat("M_GoldHorn", (0.85, 0.62, 0.15))
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "stag.glb"), use_selection=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_skins=True, export_image_format="WEBP")
    print("EXPORTED stag", sorted(a.name for a in bpy.data.actions))


DOGA = A + "acik/doga/AllModels.blend"
KALE = A + "acik/kale/FBX/"
DOGA_OBJS = ["BirchTree_1", "BirchTree_2", "BirchTree_3", "DeadTree_1", "DeadTree_2", "DeadTree_3", "DeadTree_4", "DeadTree_6",
             "MapleTree_1", "MapleTree_2", "NormalTree_1", "NormalTree_2", "NormalTree_3", "PineTree_1", "PineTree_2", "PineTree_3",
             "PineTree_4", "Bush", "Bush_Large", "Bush_Flowers", "Flower_2_Clump", "Flower_4_Clump", "Grass_Large",
             "Rock_1", "Rock_2", "Rock_3", "Rock_4", "Rock_5", "Plant_1"]
KALE_OBJS = ["Tower", "LargeTower", "SmallTower", "Watchtower", "WatchTowerWRoof", "TallWall", "WallEntrance", "PointyTower"]


def build_env():
    # doga.glb: her model kendi adıyla, orijini tabanında; oyunda kopyalanıp sahneye serpilir
    bpy.ops.wm.read_factory_settings(use_empty=True)
    with bpy.data.libraries.load(DOGA) as (src, dst):
        dst.objects = [n for n in DOGA_OBJS if n in src.objects]
    for o in dst.objects:
        bpy.context.scene.collection.objects.link(o)
        o.location = (0, 0, 0)
        o.rotation_euler = (0, 0, 0)
    clean_textures()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "doga.glb"), use_selection=True, export_image_format="WEBP", export_apply=True)
    print("EXPORTED doga", [o.name for o in dst.objects], [round(o.dimensions.z, 2) for o in dst.objects])
    # kale.glb: beyaz taşlar kum-taş rengine, kırmızı çatılar Ötüken'in firuze çinisine boyanır
    bpy.ops.wm.read_factory_settings(use_empty=True)
    for n in KALE_OBJS:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.fbx(filepath=KALE + n + ".fbx")
        new = [o for o in set(bpy.data.objects) - before]
        meshes = [o for o in new if o.type == "MESH"]
        for o in meshes:
            o.data.transform(o.matrix_world)
            o.matrix_world = Matrix.Identity(4)
            o.parent = None
        for o in new:
            if o.type != "MESH":
                bpy.data.objects.remove(o, do_unlink=True)
        bpy.ops.object.select_all(action="DESELECT")
        for o in meshes:
            o.select_set(True)
        bpy.context.view_layer.objects.active = meshes[0]
        if len(meshes) > 1:
            bpy.ops.object.join()
        meshes[0].name = n
        opaque(meshes[0])
    for m in bpy.data.materials:
        if not m.use_nodes or "Principled BSDF" not in m.node_tree.nodes:
            continue
        bsdf = m.node_tree.nodes["Principled BSDF"]
        r, g, b, _ = bsdf.inputs["Base Color"].default_value
        if r > 0.5 and g < 0.3:  # kırmızı çatı
            bsdf.inputs["Base Color"].default_value = (0.03, 0.34, 0.33, 1)
        elif r > 0.6 and g > 0.6:  # beyaz taş
            bsdf.inputs["Base Color"].default_value = (0.72, 0.56, 0.36, 1)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "kale.glb"), use_selection=True, export_image_format="WEBP")
    print("EXPORTED kale", [(o.name, [round(v, 2) for v in o.dimensions]) for o in bpy.data.objects])


def hashf(c):
    # konuma bağlı sabit sözde rastgele sayı (yırtık etek kenarı için)
    return (math.sin(c.x * 12.9898 + c.y * 78.233 + c.z * 37.719) * 43758.5453) % 1


def build_albasti():
    # Al karısı: yere değmeden süzülen, sarı saçlı, yırtık kızıl elbiseli kötü ruh
    setup(["Hair_Long"], "Superhero_Female_FullBody")
    arm = S["arm"]
    pelvis = arm.matrix_world @ arm.data.bones["pelvis"].head_local
    neck = arm.matrix_world @ arm.data.bones["neck_01"].head_local
    waist = pelvis.z + 0.1

    def top(c):
        if c.z < waist - 0.04 or (abs(c.x) > 0.3 and c.z > neck.z - 0.25):
            return None
        return "BloodDark" if c.z < waist + 0.05 else "Blood"

    shell("Dress", {"torso", "arm"}, 0.012, top)

    def skirt(bm, seg=28, rows=8):
        # belden yere uzanan kloş etek; alt kenar yırtık
        ring = []
        for r in range(rows + 1):
            t = r / rows
            z = waist - t * (waist - 0.12)
            rad = 0.2 + t * 0.32
            row = []
            for i in range(seg):
                a = i / seg * math.tau
                zz = z + ((0.12 if i % 2 else 0) + hashf(Vector((i, r, 0))) * 0.08 if r == rows else 0)
                row.append(bm.verts.new((math.cos(a) * rad, pelvis.y + math.sin(a) * rad * 0.9, zz)))
            ring.append(row)
        for r in range(rows):
            for i in range(seg):
                bm.faces.new((ring[r][i], ring[r][(i + 1) % seg], ring[r + 1][(i + 1) % seg], ring[r + 1][i]))

    skirt_ob = solid("Skirt", skirt, "Blood", True)
    skirt_ob.modifiers.new("kalınlık", "SOLIDIFY").thickness = 0.01
    join("Skirt", [skirt_ob], "pelvis")

    def hair_sheet(bm, w=0.34, rows=8):
        # sırta dökülen uzun sarı saç
        grid = []
        for r in range(rows + 1):
            t = r / rows
            z = neck.z + 0.14 - t * (neck.z + 0.14 - (waist - 0.15))
            ww = w * (1 - t * 0.35)
            y = neck.y + 0.1 + math.sin(t * math.pi) * 0.06 + t * 0.04
            grid.append([bm.verts.new((x * ww, y, z - (0.05 if r == rows and k % 2 else 0))) for k, x in enumerate((-0.5, -0.25, 0, 0.25, 0.5))])
        for r in range(rows):
            for k in range(4):
                bm.faces.new((grid[r][k], grid[r][k + 1], grid[r + 1][k + 1], grid[r + 1][k]))

    hair_ob = solid("Mane", hair_sheet, "Straw", True)
    hair_ob.modifiers.new("kalınlık", "SOLIDIFY").thickness = 0.02
    join("Mane", [hair_ob], "spine_03")
    hide_skin({"leg", "boot"})
    finish("albasti", [("float", "Idle_Loop", 20)])


def head_copy(name, side, tilt, off=(0.27, 0.02, -0.1), sc=1.0):
    # Gövdenin baş kısmını (ve göz, kaş, saç, sakal) kopyalayıp omuza yerleştirir; spine_03'e bağlanır
    body, arm = S["body"], S["arm"]
    gname = {g.index: g.name for g in body.vertex_groups}
    head_faces = lambda bm: [f for f in bm.faces if not all(
        v.index < len(body.data.vertices) and body.data.vertices[v.index].groups and
        gname[max(body.data.vertices[v.index].groups, key=lambda g: g.weight).group] in ("Head",) for v in f.verts)]
    parts = []
    for src in [o for o in S["coll"].objects if o.type == "MESH" and o.parent == arm and not o.name.startswith("Head_") and not o.data.name.startswith(("Kaftan", "Loin", "Mantle", "Wraps"))]:
        ob = src.copy()
        ob.data = src.data.copy()
        S["coll"].objects.link(ob)
        if src == body:
            bm = bmesh.new()
            bm.from_mesh(ob.data)
            bm.verts.ensure_lookup_table()
            bmesh.ops.delete(bm, geom=head_faces(bm), context="FACES")
            bm.to_mesh(ob.data)
            bm.free()
        ob.vertex_groups.clear()
        vg = ob.vertex_groups.new(name="spine_03")
        vg.add(list(range(len(ob.data.vertices))), 1.0, "REPLACE")
        pivot = Vector((0, 0.03, 1.5))
        ob.data.transform(Matrix.Translation(pivot + Vector((side * off[0], off[1], off[2]))) @ Matrix.Rotation(side * tilt, 4, "Y") @ Matrix.Scale(sc, 4) @ Matrix.Translation(-pivot))
        parts.append(ob)
    bpy.ops.object.select_all(action="DESELECT")
    for o in parts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    parts[0].name = name
    return parts[0]


def build_yelbegen():
    # Yedi başlı dev: kurt postu, kürk peştamal, dev balta
    setup(["Hair_Long", "Hair_Beard"])
    head_copy("Head_L", -1, 0.5)
    head_copy("Head_R", 1, 0.5)
    head_copy("Head_L2", -1, 0.25, (0.13, 0.13, 0.16), 0.8)  # Altay masallarında Sarı Yelbegen yedi başlıdır
    head_copy("Head_R2", 1, 0.25, (0.13, 0.13, 0.16), 0.8)
    head_copy("Head_L3", -1, 0.9, (0.42, 0.1, -0.02), 0.72)
    head_copy("Head_R3", 1, 0.9, (0.42, 0.1, -0.02), 0.72)
    shell("Loin", {"torso", "leg"}, 0.02, lambda c: ("DarkFur" if c.z > 1.0 else "Pelt") if 0.62 < c.z < 1.06 else None)
    shell("Mantle", {"torso", "arm"}, 0.035, lambda c: "Pelt" if c.z > 1.3 and abs(c.x) < 0.4 else None)
    shell("Wraps", {"boot"}, 0.014, lambda c: "Leather" if c.z > 0.12 else None)

    def axe_head(bm):
        pts = [(0, 0.6, 0), (-0.03, 0.8, 0), (-0.32, 0.92, 0), (-0.38, 0.7, 0), (-0.32, 0.46, 0), (-0.03, 0.6, 0)]
        f = bm.faces.new([bm.verts.new(p) for p in pts])
        bmesh.ops.solidify(bm, geom=[f], thickness=0.035)

    join("Axe", place([weapon("Axe_Double", 1.25, 0.12)], HAND_R, RZ(math.pi)), "hand_r")
    finish("yelbegen", [("run", "Sprint_Loop", 8)])


def build_erlik():
    # Yeraltının hükümdarı: dizine inen kara sakal, kökler gibi kıvrık boynuzlar, demir taç, kara cübbe, balyoz
    setup(["Hair_Long", "Hair_Beard"])
    for o in S["coll"].objects:
        if o.type == "MESH" and "Beard" in o.data.name:
            chin = max(v.co.z for v in o.data.vertices) - 0.12
            for v in o.data.vertices:
                if v.co.z < chin:
                    v.co.z = chin - (chin - v.co.z) * 3.2
                    v.co.y -= (chin - v.co.z) * 0.08

    def robe(c):
        if abs(c.x) > 0.62 or (c.z > 1.47 and abs(c.x) < 0.2):
            return "Gold"
        if 1.0 < c.z < 1.08 and abs(c.x) < 0.3:
            return "Blood"
        return "Dark"

    shell("Robe", {"torso", "arm"}, 0.018, robe)
    shell("Legs", {"leg"}, 0.012, lambda c: "Dark")
    shell("Boots", {"boot"}, 0.014, lambda c: "Black", drop_toes)
    boot_feet("Black")
    hide_skin({"torso", "arm", "leg", "boot"})
    HAT = Vector((0, 0.02, 1.76))
    join("Crown", [
        solid("c1", torus(0.105, 0.02, HAT, RX(0)), "Iron", True),
        *[solid(f"c{i + 2}", cyl(0.02, 0.0, 0.1, 4, HAT + Vector((math.cos(a) * 0.105, math.sin(a) * 0.105, 0.05))), "Gold")
          for i, a in enumerate([k * math.tau / 7 for k in range(7)])],
        solid("h1", horn(0.42, 0.045, 0.25, HAT + Vector((-0.09, 0.02, 0.02)), RY(-0.9) @ RX(0.3)), "Horn", True),
        solid("h2", horn(0.42, 0.045, 0.25, HAT + Vector((0.09, 0.02, 0.02)), RY(0.9) @ RX(0.3)), "Horn", True),
    ], "Head")

    def spikes(bm):
        for i in range(12):
            a, b = i * 2.39996, math.acos(1 - 2 * (i + 0.5) / 12)
            d = Vector((math.sin(b) * math.cos(a), math.cos(b), math.sin(b) * math.sin(a)))
            m = Matrix.Translation(Vector((0, 0.95, 0)) + d * 0.14) @ d.to_track_quat("Z", "Y").to_matrix().to_4x4()
            bmesh.ops.create_cone(bm, cap_ends=True, segments=5, radius1=0.04, radius2=0.0, depth=0.12, matrix=m @ Matrix.Translation((0, 0, 0.05)))

    join("Mace", place([
        solid("m1", cyl(0.025, 0.025, 1.0, 8, (0, 0.4, 0), RX(math.pi / 2)), "Horn"),
        solid("m2", ball(0.16, (0, 0.95, 0)), "Iron", True),
        solid("m3", spikes, "Iron"),
    ], HAND_R, RZ(math.pi)), "hand_r")
    finish("erlik", [("smash", "Punch_Cross", 10)])


def wing(side, span, material):
    # Tüy uçlu kanat: kök orijinde, dışa (+x*side) ve geriye (+y) açılır
    def f(bm):
        pts = [(0, -0.2), (0.35, -0.45), (0.8, -0.5), (1.0, -0.35)]
        for i in range(6):  # arka kenarda tüy dişleri
            t = i / 5
            pts.append((1.0 - t * 0.95, 0.25 + t * 0.45 + (0.18 if i % 2 else 0)))
        pts.append((0, 0.35))
        face = bm.faces.new([bm.verts.new((x * span * side, y * span * 0.55, 0)) for x, y in (pts if side > 0 else pts[::-1])])
        bmesh.ops.solidify(bm, geom=[face], thickness=span * 0.03)
    return solid("wing", f, material)


def bone_child(ob, name, bone, at):
    ob.name = name
    ob.location = at
    bpy.context.view_layer.update()  # dünya matrisi konuma göre yenilensin
    mw = ob.matrix_world.copy()
    ob.parent = S["arm"]
    ob.parent_type = "BONE"
    ob.parent_bone = bone
    ob.matrix_world = mw


def build_tulpar():
    # Kanatlı ak at: altın yele, sırtta tüy kanatlar (oyunda çırpılır)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=HORSE_WHITE)
    for o in list(bpy.data.objects):
        if o.name.startswith("Icosphere"):
            bpy.data.objects.remove(o)
    arm = [o for o in bpy.data.objects if o.type == "ARMATURE"][0]
    me = [o for o in bpy.data.objects if o.type == "MESH"][0]
    S.update(arm=arm, coll=me.users_collection[0])
    S["M"] = {k: mat("M_" + k, tuple(int(v[i:i + 2], 16) / 255 for i in (0, 2, 4))) for k, v in COLORS.items()}
    for name, hexc in {"Main": "f3efe4", "Main_Dark": "d6cdb8", "Main_Light": "ffffff", "Hair": "e8b83a"}.items():
        m = bpy.data.materials.get(name)
        if m and m.use_nodes:
            m.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*[(int(hexc[i:i + 2], 16) / 255) ** 2.2 for i in (0, 2, 4)], 1)
    top = max((me.matrix_world @ v.co).z for v in me.data.vertices if abs(v.co.x) < 0.25 and -0.6 < v.co.y < 0.4)
    for side, name in ((-1, "Wing_L"), (1, "Wing_R")):  # kemiğe değil modele bağlı: yana açılır, oyunda z ekseninde çırpılır
        w = wing(side, 3.2, "Feather")
        w.name = name
        w.location = (side * 0.45, -0.55, top - 0.15)
    SAD = Vector((0, -0.1, top))
    join("Saddle", [
        solid("sd1", box(1.25, 1.3, 0.08, SAD), "Kaftan"),
        solid("sd2", box(1.3, 1.34, 0.05, SAD + Vector((0, 0, -0.03))), "Gold"),
        solid("sd3", box(0.75, 0.95, 0.22, SAD + Vector((0, 0, 0.13))), "Leather"),
        solid("sd4", box(0.7, 0.18, 0.28, SAD + Vector((0, -0.45, 0.22))), "Gold"),
    ], "Torso")
    clean_textures()
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "tulpar.glb"), use_selection=True, export_animations=True,
                              export_animation_mode="ACTIONS", export_skins=True, export_image_format="WEBP")
    print("EXPORTED tulpar")


def build_karakus():
    # Kara kuş: iskeletsiz; kanatlar ayrı parça, oyunda çırpılır. -Y'ye bakar (oyunda +Z, oyuncuya).
    bpy.ops.wm.read_factory_settings(use_empty=True)
    S["coll"] = bpy.context.scene.collection
    S["M"] = {k: mat("M_" + k, tuple(int(v[i:i + 2], 16) / 255 for i in (0, 2, 4))) for k, v in COLORS.items()}
    body = [
        solid("k1", ball(1, (0, 0, 0), (0.32, 0.75, 0.3)), "Black", True),
        solid("k2", ball(0.22, (0, -0.72, 0.14)), "Black", True),
        solid("k3", cyl(0.07, 0.0, 0.26, 6, (0, -0.98, 0.1), RX(math.pi / 2)), "Gold", True),
        solid("k4", ball(0.045, (-0.1, -0.86, 0.2)), "Iris", True),
        solid("k5", ball(0.045, (0.1, -0.86, 0.2)), "Iris", True),
        solid("k6", box(0.5, 0.55, 0.04, (0, 0.95, 0.02)), "Black"),
    ]
    bpy.ops.object.select_all(action="DESELECT")
    for o in body:
        o.select_set(True)
    bpy.context.view_layer.objects.active = body[0]
    bpy.ops.object.join()
    body[0].name = "Body"
    for side, name in ((-1, "Wing_L"), (1, "Wing_R")):
        w = wing(side, 1.6, "Black")
        w.name = name
        w.location = (side * 0.22, -0.1, 0.08)
    bpy.ops.object.select_all(action="SELECT")
    bpy.ops.export_scene.gltf(filepath=os.path.join(OUT, "karakus.glb"), use_selection=True, export_animations=False)
    print("EXPORTED karakus")


def lamellar(c, base="Lacquer", band="Iron", trim="Gold"):
    # Tang dönemi zırh: kırmızı cilalı gövde, metal omuzluk, altın kenar, deri kuşak (göğüs aynaları ayrı parça)
    if abs(c.x) > 0.62:
        return trim  # kol ağzı
    if c.z > 1.47 and abs(c.x) < 0.2:
        return trim  # yaka
    if 1.0 < c.z < 1.07 and abs(c.x) < 0.3:
        return "Leather"
    if abs(c.x) > 0.3 and c.z > 1.32:
        return band  # omuzluk
    return base


def mirrors(metal):
    # Tang "mingguang" zırhının göğüsteki iki yuvarlak ayna plakası
    join("Mirrors", [solid(f"mr{sd}", cyl(0.075, 0.075, 0.02, 20, (sd * 0.1, -0.16, 1.36), RX(math.pi / 2)), metal, True) for sd in (-1, 1)], "spine_03")


def tang_helmet(plume, trim, wings=False):
    HAT = Vector((0, 0.02, 1.7))
    parts = [
        solid("t1", ball(1, HAT, (0.12, 0.128, 0.15), cut=-0.15), "Iron", True),
        solid("t2", torus(0.12, 0.014, HAT + Vector((0, 0, -0.01)), RX(0)), trim, True),
        solid("t3", box(0.26, 0.04, 0.13, HAT + Vector((0, 0.13, -0.09)), RX(0.25)), "Iron"),  # ense siperi (arkada)
        solid("t4", cyl(0.012, 0.012, 0.1, 6, HAT + Vector((0, 0, 0.17))), trim),
        solid("t5", cyl(0.0, 0.05, 0.16, 8, HAT + Vector((0, 0, 0.27)), RX(math.pi)), plume, True),  # püskül
    ]
    if wings:
        for sd in (-1, 1):
            parts.append(solid(f"tw{sd}", box(0.02, 0.1, 0.16, HAT + Vector((sd * 0.13, 0.02, 0.08)), RY(sd * 0.35)), trim))
    join("Helmet", parts, "Head")


def dao(prefix, width=0.07, length=0.6):
    return [
        solid(prefix + "g", cyl(0.05, 0.05, 0.02, 12, (0, 0.09, 0), RX(math.pi / 2)), "Gold"),
        solid(prefix + "h", cyl(0.017, 0.017, 0.16, 8, (0, 0.0, 0), RX(math.pi / 2)), "Blood"),
        solid(prefix + "b", lambda bm: saber(bm, length=length, width=width, curve=0.06), "Steel"),
    ]


def build_cinli():
    # Tang imparatorluk askeri: kırmızı cilalı lamel zırh, püsküllü demir miğfer; kılıç, kalkan, mızrak
    setup([])
    shell("Armor", {"torso", "arm"}, 0.016, lamellar)
    shell("Skirt", {"leg"}, 0.02, lambda c: ("Iron" if c.z < 0.72 else "Lacquer") if c.z > 0.62 else "Black")
    mirrors("Iron")
    shell("Boots", {"boot"}, 0.014, lambda c: "Black", drop_toes)
    boot_feet("Black")
    hide_skin({"torso", "arm", "leg", "boot"})
    tang_helmet("Blood", "Gold")
    join("Dao", place(dao("d"), HAND_R, RZ(math.pi)), "hand_r")
    SH = Vector((0.55, -0.1, 1.44))
    join("Shield", place([
        solid("s1", box(0.5, 0.05, 0.75), "Lacquer"),
        solid("s2", box(0.54, 0.04, 0.79, (0, 0.01, 0)), "Gold"),
        solid("s3", cyl(0.1, 0.1, 0.06, 16, (0, -0.03, 0.05), RX(math.pi / 2)), "Gold"),
    ], SH, RX(0) @ RZ(math.pi / 2)), "lowerarm_l")
    join("Spear", place([
        solid("p1", cyl(0.016, 0.016, 1.9, 8, (0, 0.55, 0), RX(math.pi / 2)), "Wood"),
        solid("p2", cyl(0.035, 0.0, 0.28, 4, (0, 1.62, 0), RX(-math.pi / 2)), "Steel"),
        solid("p3", cyl(0.05, 0.02, 0.12, 8, (0, 1.42, 0), RX(math.pi / 2)), "Blood"),  # kırmızı püskül
    ], HAND_R, RZ(math.pi)), "hand_r")
    finish("cinli", [("attack", "Sword_Attack", 12)])


def build_general():
    # Çin Generali: altın bantlı zırh, kanatlı miğfer ve uzun kırmızı tuğ, yuvarlak kalkan, geniş kılıç
    setup(["Hair_Beard"])
    shell("Armor", {"torso", "arm"}, 0.018, lambda c: lamellar(c, "Lacquer", "Gold", "Gold"))
    shell("Skirt", {"leg"}, 0.022, lambda c: ("Gold" if c.z < 0.68 else "Lacquer") if c.z > 0.58 else "Black")
    mirrors("Gold")
    shell("Boots", {"boot"}, 0.014, lambda c: "Black", drop_toes)
    boot_feet("Black")
    hide_skin({"torso", "arm", "leg", "boot"})
    tang_helmet("Blood", "Gold", wings=True)
    join("Dao", place(dao("d", 0.09, 0.72), HAND_R, RZ(math.pi)), "hand_r")
    SH = Vector((0.55, -0.1, 1.44))
    join("Shield", place([
        solid("s1", cyl(0.4, 0.4, 0.05, 24), "Lacquer", True),
        solid("s2", torus(0.4, 0.03, (0, 0, 0), RX(0)), "Gold", True),
        solid("s3", ball(0.12, (0, 0, 0.04), (1, 1, 0.5)), "Gold", True),
    ], SH, RX(math.pi / 2)), "lowerarm_l")
    finish("general", [("guard", "Sword_Idle", 10)])


def dog_head(prefix="dh", fur="DarkFur", scale=1.0):
    # İt-Barak'ın it başı: insan başını örten kürklü kafa, uzun burun, dik kulaklar, kor gözler, dişler
    H = Vector((0, 0.0, 1.66))
    k = scale
    return [
        solid(prefix + "1", ball(1, H, (0.15 * k, 0.16 * k, 0.15 * k)), fur, True),
        solid(prefix + "2", ball(1, H + Vector((0, -0.17, -0.04)) * k, (0.07 * k, 0.12 * k, 0.06 * k)), fur, True),
        solid(prefix + "3", ball(0.03 * k, H + Vector((0, -0.285, -0.02)) * k), "Black", True),
        solid(prefix + "4", cyl(0.05 * k, 0.0, 0.16 * k, 4, H + Vector((0.085, 0.02, 0.15)) * k, RY(0.25)), fur),
        solid(prefix + "5", cyl(0.05 * k, 0.0, 0.16 * k, 4, H + Vector((-0.085, 0.02, 0.15)) * k, RY(-0.25)), fur),
        solid(prefix + "6", ball(0.022 * k, H + Vector((0.055, -0.13, 0.04)) * k), "GlowRed", True),
        solid(prefix + "7", ball(0.022 * k, H + Vector((-0.055, -0.13, 0.04)) * k), "GlowRed", True),
        *[solid(prefix + f"t{i}", cyl(0.012 * k, 0.0, 0.05 * k, 4, H + Vector((x, -0.24, -0.08)) * k, RX(math.pi)), "Bone") for i, x in enumerate([-0.035, 0.035])],
    ]


def build_itbarak(name="itbarak", coats=False):
    # İt-Barak (Kıl-Barak): Karanlık Ülke'nin it başlı, kıllı savaşçıları. Pehlivanları üç kat kara-ak yapışkanla sıvanır.
    setup([])
    shell("Tunic", {"torso", "arm"}, 0.016, lambda c: None if abs(c.x) > 0.5 else ("DarkFur" if c.z < 1.02 or c.z > 1.42 else "Hide"))
    shell("Legs", {"leg"}, 0.01, lambda c: "Leather")
    shell("Boots", {"boot"}, 0.014, lambda c: "DarkFur", drop_toes)
    boot_feet("DarkFur")
    if coats:  # üç kat yapışkan: dıştan içe kırılır (Ögel s.186)
        picks = {"Coat3": lambda c: "Coat1" if hashf(c) < 0.5 else "Coat2", "Coat2": lambda c: "Coat2", "Coat1": lambda c: "Coat1"}
        for nm, off in [("Coat3", 0.022), ("Coat2", 0.03), ("Coat1", 0.038)]:
            shell(nm, {"torso", "arm", "leg"}, off, picks[nm])
    hide_skin({"torso", "leg", "boot"})
    join("DogHead", dog_head(), "Head")

    def axe_head(bm):
        pts = [(0, 0.5, 0), (-0.02, 0.62, 0), (-0.18, 0.72, 0), (-0.22, 0.56, 0), (-0.16, 0.42, 0), (-0.02, 0.48, 0)]
        f = bm.faces.new([bm.verts.new(p) for p in pts])
        bmesh.ops.solidify(bm, geom=[f], thickness=0.02)
    join("Axe", place([weapon("Axe_Small", 0.7, 0.12)], HAND_R, RZ(math.pi)), "hand_r")
    join("Shield", place([shield_mesh("Shield_Round", 0.62)], Vector((0.55, -0.12, 1.44)), RX(0)), "lowerarm_l")
    finish(name, [("attack", "Sword_Attack", 12)])


def build_sulu():
    # Sulu: Kara Bataklık'ta suyun altında bekleyen, yosunlu yırtık giysili ölü; yeşil kor gözler
    setup(["Hair_Long"])
    shell("Rags", {"torso", "arm"}, 0.014, lambda c: None if (abs(c.x) > 0.42 or hashf(c) < 0.25) else ("Moss" if hashf(c * 3) < 0.4 else "Rag"))
    shell("Legs", {"leg"}, 0.009, lambda c: None if hashf(c) < 0.3 else "Swamp")
    weeds = []
    for i in range(10):  # omuzlardan sarkan su yosunu
        a = i / 10 * math.tau
        top = Vector((math.cos(a) * 0.2, math.sin(a) * 0.14 + 0.03, 1.46))
        weeds.append(solid(f"w{i}", box(0.03, 0.01, 0.35, top + Vector((0, 0, -0.17))), "Moss"))
    join("Weeds", weeds, "spine_03")
    finish("sulu", [("idle", "Idle_Loop", 10)])


def build_almas():
    # Almas: Altay dağlarının kıllı yaban adamı; baştan ayağa kürk, kalın kaşlar, buz kayası fırlatır
    setup(["Hair_Long", "Hair_Beard"])
    shell("Fur", {"torso", "arm", "leg"}, 0.02, lambda c: "DarkFur" if c.z < 0.75 or abs(c.x) > 0.55 else "Pelt")
    shell("Feet", {"boot"}, 0.016, lambda c: "DarkFur", drop_toes)
    boot_feet("DarkFur")
    hide_skin({"torso", "arm", "leg", "boot"})
    H = Vector((0, 0.02, 1.7))
    join("Brow", [solid("br1", box(0.17, 0.03, 0.025, H + Vector((0, -0.1, 0.0))), "DarkFur")], "Head")
    finish("almas", [("throw", "Punch_Cross", 10)])


def build_sulmus():
    # Şulmus: Erlik'in demirhanesinde örste doğan iblis (Ögel s.461); kızıl deri, kara boynuz, kuyruk, sarı kor gözler
    setup([])
    shell("Loin", {"torso"}, 0.016, lambda c: "Black" if c.z < 1.02 else None)
    shell("Legs", {"leg"}, 0.009, lambda c: "Black" if c.z > 0.62 else None)
    shell("Boots", {"boot"}, 0.012, lambda c: "Horn", drop_toes)
    boot_feet("Horn")
    HAT = Vector((0, 0.02, 1.72))
    join("Horns", [
        solid("h1", horn(0.22, 0.03, -0.1, HAT + Vector((-0.07, 0.0, 0.03)), RY(-0.6)), "Horn", True),
        solid("h2", horn(0.22, 0.03, -0.1, HAT + Vector((0.07, 0.0, 0.03)), RY(0.6)), "Horn", True),
        solid("e1", ball(0.016, HAT + Vector((0.035, -0.105, -0.045))), "GlowYellow", True),
        solid("e2", ball(0.016, HAT + Vector((-0.035, -0.105, -0.045))), "GlowYellow", True),
    ], "Head")
    join("Tail", [solid("t1", horn(0.7, 0.035, -0.35, Vector((0, 0.14, 0.98)), RX(-2.2)), "RedSkin", True)], "pelvis")
    finish("sulmus", [("idle", "Idle_Loop", 10)])


def build_kerey():
    # Kerey Han: Erlik'in oğlu, Kara-Teş'in (insan dünyasının cehennemi) hükümdarı; burun kemiği bakırdır (Ögel s.458)
    setup(["Hair_Long", "Hair_Beard"])

    def robe(c):
        if abs(c.x) > 0.62 or (c.z > 1.47 and abs(c.x) < 0.2):
            return "Copper"
        if 1.0 < c.z < 1.08 and abs(c.x) < 0.3:
            return "Copper"
        return "Dark" if abs(c.x) > 0.2 else "BloodDark"

    shell("Robe", {"torso", "arm"}, 0.018, robe)
    shell("Legs", {"leg"}, 0.012, lambda c: "Dark")
    shell("Boots", {"boot"}, 0.014, lambda c: "Black", drop_toes)
    boot_feet("Black")
    hide_skin({"torso", "arm", "leg", "boot"})
    HAT = Vector((0, 0.02, 1.76))
    join("CopperNose", [  # dev bakır burun: savaşta zayıf noktası
        solid("n1", cyl(0.05, 0.012, 0.2, 6, HAT + Vector((0, -0.16, -0.12)), RX(math.pi / 2 + 0.35)), "Copper", True),
        solid("n2", torus(0.05, 0.012, HAT + Vector((0, -0.1, -0.1)), RX(math.pi / 2)), "Gold", True),
    ], "Head")
    join("Crown", [
        solid("c1", torus(0.105, 0.02, HAT, RX(0)), "Copper", True),
        solid("h1", horn(0.25, 0.035, 0.12, HAT + Vector((-0.09, 0.02, 0.02)), RY(-0.9)), "Horn", True),
        solid("h2", horn(0.25, 0.035, 0.12, HAT + Vector((0.09, 0.02, 0.02)), RY(0.9)), "Horn", True),
    ], "Head")
    join("Mace", place([weapon("Hammer_Double", 1.15, 0.1)], HAND_R, RZ(math.pi)), "hand_r")
    finish("kerey", [("smash", "Punch_Cross", 10)])


def build_esir():
    # Esir Türk: yırtık giysi, boynunda tahta boyunduruk (kurtarılınca kırılır)
    setup(["Hair_Long", "Hair_Beard"])
    shell("Tunic", {"torso", "arm"}, 0.014, lambda c: None if (abs(c.x) > 0.45 or (c.z < 0.95 and hashf(c) < 0.3)) else "Rag")
    shell("Trousers", {"leg"}, 0.009, lambda c: None if c.z < 0.6 and hashf(c) < 0.4 else "Leather")
    hide_skin({"torso"})
    NECK = Vector((0, 0.03, 1.5))
    join("Cangue", [
        solid("c1", box(0.75, 0.55, 0.07, NECK), "Wood"),
        solid("c2", cyl(0.02, 0.02, 0.09, 8, NECK + Vector((-0.3, 0, 0))), "Iron"),
        solid("c3", cyl(0.02, 0.02, 0.09, 8, NECK + Vector((0.3, 0, 0))), "Iron"),
    ], "spine_03")
    finish("esir", [("idle", "Idle_Loop", 10)])


which = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else ["oguz", "kormos", "tepegoz", "anims", "horse", "wolf", "albasti", "yelbegen", "erlik", "tulpar", "karakus", "cinli", "general", "esir"]
for w in which:
    {"oguz": build_oguz, "kormos": build_kormos, "tepegoz": build_tepegoz, "anims": build_anims, "horse": build_horse, "wolf": build_wolf,
     "albasti": build_albasti, "yelbegen": build_yelbegen, "erlik": build_erlik, "tulpar": build_tulpar, "karakus": build_karakus,
     "cinli": build_cinli, "general": build_general, "esir": build_esir, "stag": build_stag,
     "itbarak": build_itbarak, "boyali": lambda: build_itbarak("boyali", True), "sulu": build_sulu, "almas": build_almas,
     "sulmus": build_sulmus, "kerey": build_kerey, "env": build_env}[w]()
