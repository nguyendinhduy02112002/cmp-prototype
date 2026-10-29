import assert from "node:assert/strict";
import { create } from "zustand";
//#region src/lib/property-data.ts
var PROPERTY_STORAGE_KEY = "cmp-tenant-properties-v1";
var PROPERTY_CODE_RE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;
var ORIGIN_RE = /^https:\/\/([a-z0-9](?:[a-z0-9.-]*[a-z0-9])?)(?::\d{1,5})?$/i;
var MOBILE_ID_RE = /^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z][A-Za-z0-9_-]*)+$/;
var memory = {};
var valid$1 = (tenantId, p) => {
	if (!p || typeof p !== "object") return false;
	const x = p;
	return x.tenantId === tenantId && typeof x.id === "string" && typeof x.applicationId === "string" && typeof x.name === "string" && typeof x.code === "string" && PROPERTY_CODE_RE.test(x.code) && [
		"WEB",
		"ANDROID",
		"IOS"
	].includes(String(x.type)) && ["ACTIVE", "INACTIVE"].includes(String(x.status)) && typeof x.createdAt === "string" && typeof x.updatedAt === "string" && typeof x.createdBy === "string";
};
function readPropertySnapshot() {
	let raw = memory;
	if (typeof window !== "undefined") try {
		raw = JSON.parse(window.localStorage.getItem("cmp-tenant-properties-v1") || "{}");
	} catch {
		raw = {};
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	return Object.fromEntries(Object.entries(raw).map(([tenantId, rows]) => [tenantId, Array.isArray(rows) ? rows.filter((p) => valid$1(tenantId, p)) : []]));
}
function persistTenantProperties(tenantId, properties) {
	const snapshot = {
		...readPropertySnapshot(),
		[tenantId]: properties.map((p) => ({ ...p }))
	};
	memory = snapshot;
	if (typeof window !== "undefined") window.localStorage.setItem(PROPERTY_STORAGE_KEY, JSON.stringify(snapshot));
}
function validatePropertyInput(input, properties, applicationId, propertyId) {
	const value = {
		...input,
		name: input.name.trim(),
		code: input.code.trim().toUpperCase(),
		origin: input.origin?.trim() || "",
		packageName: input.packageName?.trim() || "",
		bundleId: input.bundleId?.trim() || "",
		description: input.description?.trim() || ""
	};
	const errors = {};
	if (!value.name) errors.name = "Tên Property là bắt buộc.";
	else if (value.name.length > 100) errors.name = "Tên Property không được vượt quá 100 ký tự.";
	else if (properties.some((p) => p.id !== propertyId && p.applicationId === applicationId && p.name.toLowerCase() === value.name.toLowerCase())) errors.name = "Tên Property đã tồn tại trong Application này.";
	if (!value.code) errors.code = "Mã Property là bắt buộc.";
	else if (value.code.length > 50 || !PROPERTY_CODE_RE.test(value.code)) errors.code = "Dùng 1–50 ký tự in hoa, số và dấu gạch ngang; bắt đầu bằng chữ.";
	else if (properties.some((p) => p.id !== propertyId && p.applicationId === applicationId && p.code === value.code)) errors.code = "Mã Property đã tồn tại trong Application này.";
	if (value.type === "WEB") {
		if (!ORIGIN_RE.test(value.origin)) errors.origin = "Origin phải có dạng https://host[:port], không có đường dẫn hoặc ký tự đại diện.";
	}
	if (value.type === "ANDROID" && !MOBILE_ID_RE.test(value.packageName)) errors.packageName = "Package name không hợp lệ, ví dụ com.example.retail.";
	if (value.type === "IOS" && !MOBILE_ID_RE.test(value.bundleId)) errors.bundleId = "Bundle ID không hợp lệ, ví dụ com.example.retail.";
	const technical = value.type === "WEB" ? value.origin.toLowerCase() : value.type === "ANDROID" ? value.packageName.toLowerCase() : value.bundleId.toLowerCase();
	if (technical && properties.some((p) => p.id !== propertyId && (p.origin || p.packageName || p.bundleId || "").toLowerCase() === technical)) errors[value.type === "WEB" ? "origin" : value.type === "ANDROID" ? "packageName" : "bundleId"] = "Định danh kỹ thuật đã được dùng bởi Property khác trong tenant.";
	if (value.description.length > 500) errors.description = "Mô tả không được vượt quá 500 ký tự.";
	return {
		value,
		errors
	};
}
//#endregion
//#region src/lib/fmt.ts
var nowISO = () => (/* @__PURE__ */ new Date()).toISOString();
/** Băm mô phỏng 64 ký tự hex (không phải SHA-256 thật – chỉ để minh họa) */
function fakeHash(input) {
	let out = "";
	for (let k = 0; k < 8; k++) {
		let h = 2166136261 ^ k * 2654435761;
		for (let i = 0; i < input.length; i++) {
			h ^= input.charCodeAt(i);
			h = Math.imul(h, 16777619);
		}
		out += (h >>> 0).toString(16).padStart(8, "0");
	}
	return out;
}
/** Sinh số ngẫu nhiên có hạt giống để dữ liệu mẫu ổn định giữa các lần tải */
function rng(seed) {
	return () => {
		seed |= 0;
		seed = seed + 1831565813 | 0;
		let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
		t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
		return ((t ^ t >>> 14) >>> 0) / 4294967296;
	};
}
var seq = 1e3;
var uid = (prefix) => `${prefix}-${Date.now().toString(36).slice(-4).toUpperCase()}${(seq++).toString(36).toUpperCase()}`;
//#endregion
//#region src/lib/mock.ts
var PROPERTIES = [
	"abcmart.vn",
	"member.abcmart.vn",
	"Ứng dụng ABC Mart"
];
var APPS = [
	{
		id: "app_7Q2K9M",
		name: "Website abcmart.vn",
		property: "abcmart.vn"
	},
	{
		id: "app_3HX81P",
		name: "Cổng thành viên member.abcmart.vn",
		property: "member.abcmart.vn"
	},
	{
		id: "app_5MB20R",
		name: "Ứng dụng ABC Mart (iOS/Android)",
		property: "Ứng dụng ABC Mart"
	}
];
var PERSONA = {
	Admin: "Trần Hoàng Long",
	DPO: "Nguyễn Minh Thu",
	"Nhân viên": "Lê Quang Huy"
};
var ITEMS = [
	[
		"D-HOTEN",
		"Họ và tên",
		"Cơ bản"
	],
	[
		"D-NGAYSINH",
		"Ngày sinh",
		"Cơ bản"
	],
	[
		"D-GIOITINH",
		"Giới tính",
		"Cơ bản"
	],
	[
		"D-SDT",
		"Số điện thoại",
		"Cơ bản"
	],
	[
		"D-EMAIL",
		"Địa chỉ email",
		"Cơ bản"
	],
	[
		"D-DIACHI",
		"Địa chỉ liên hệ",
		"Cơ bản"
	],
	[
		"D-CCCD",
		"Số định danh cá nhân, CCCD",
		"Cơ bản"
	],
	[
		"D-MUAHANG",
		"Lịch sử mua hàng",
		"Cơ bản"
	],
	[
		"D-DUYETWEB",
		"Hành vi duyệt web, ứng dụng",
		"Cơ bản"
	],
	[
		"D-COOKIE",
		"Định danh cookie, thiết bị",
		"Cơ bản"
	],
	[
		"D-TAIKHOAN",
		"Tài khoản thành viên",
		"Cơ bản"
	],
	[
		"D-SUCKHOE",
		"Tình trạng sức khỏe",
		"Nhạy cảm"
	],
	[
		"D-SINHTRAC",
		"Dữ liệu sinh trắc học (ảnh khuôn mặt)",
		"Nhạy cảm"
	],
	[
		"D-VITRI",
		"Vị trí xác định qua dịch vụ định vị",
		"Nhạy cảm"
	],
	[
		"D-TAICHINH",
		"Thông tin tài khoản ngân hàng, thẻ",
		"Nhạy cảm"
	],
	[
		"D-CHINHTRI",
		"Quan điểm chính trị, tôn giáo",
		"Nhạy cảm"
	]
].map(([code, name, group]) => ({
	code,
	name,
	group
}));
ITEMS.filter((i) => i.code !== "D-CHINHTRI");
var itemByCode = (c) => ITEMS.find((i) => i.code === c);
var h = (at, who, act, note) => ({
	at,
	who,
	act,
	note
});
function P$1(o) {
	const at = o.updatedAt || "2026-06-01T03:00:00Z";
	return {
		desc: "",
		items: [],
		scope: "",
		legalBasis: "Đồng ý của chủ thể dữ liệu",
		retention: "Đến khi rút lại đồng ý",
		share: false,
		recipients: [],
		child: false,
		everActive: [
			"Hoạt động",
			"Chờ duyệt ngừng",
			"Ngừng sử dụng"
		].includes(o.status),
		history: [],
		versions: [],
		updatedAt: at,
		...o
	};
}
var PURPOSES = [
	P$1({
		code: "MEMBER-CORE",
		name: "Quản lý tài khoản thành viên",
		status: "Hoạt động",
		legalBasis: "Thực hiện hợp đồng",
		desc: "Tạo và duy trì tài khoản thành viên, tích điểm, chăm sóc khách hàng.",
		items: [
			"D-HOTEN",
			"D-SDT",
			"D-EMAIL",
			"D-NGAYSINH",
			"D-TAIKHOAN"
		],
		scope: "Thu thập, lưu trữ, sử dụng trong hệ thống thành viên",
		retention: "Trong thời gian là thành viên + 2 năm",
		updatedAt: "2026-05-20T03:00:00Z",
		history: [h("2026-05-20T03:00:00Z", "Nguyễn Minh Thu", "Phê duyệt", "Tạo mới")]
	}),
	P$1({
		code: "MKT-EMAIL",
		name: "Gửi ưu đãi qua email",
		status: "Hoạt động",
		desc: "Gửi thông tin khuyến mãi, ưu đãi thành viên qua email.",
		items: [
			"D-HOTEN",
			"D-EMAIL",
			"D-MUAHANG"
		],
		scope: "Sử dụng để gửi email tiếp thị",
		updatedAt: "2026-06-10T03:00:00Z",
		history: [h("2026-06-10T03:00:00Z", "Nguyễn Minh Thu", "Phê duyệt", "Tạo mới")]
	}),
	P$1({
		code: "MKT-PERSONAL",
		name: "Gợi ý sản phẩm cá nhân hóa",
		status: "Hoạt động",
		desc: "Phân tích lịch sử mua hàng và hành vi duyệt để gợi ý sản phẩm phù hợp.",
		items: [
			"D-MUAHANG",
			"D-DUYETWEB",
			"D-COOKIE"
		],
		scope: "Phân tích, lập hồ sơ sở thích",
		share: true,
		recipients: ["Đối tác quảng cáo Meta, TikTok (xử lý thay)"],
		updatedAt: "2026-08-28T03:00:00Z",
		history: [h("2026-08-28T03:00:00Z", "Nguyễn Minh Thu", "Phê duyệt", "Thêm bên nhận")]
	}),
	P$1({
		code: "ANALYTICS",
		name: "Đo lường truy cập website",
		status: "Hoạt động",
		desc: "Thống kê lượt truy cập, hiệu quả trang để cải thiện website.",
		items: ["D-COOKIE", "D-DUYETWEB"],
		scope: "Thống kê tổng hợp",
		share: true,
		recipients: ["Google Analytics (bên xử lý)"],
		retention: "13 tháng",
		updatedAt: "2026-06-12T03:00:00Z"
	}),
	P$1({
		code: "EKYC",
		name: "Xác thực danh tính mở ví thành viên",
		status: "Hoạt động",
		desc: "Đối chiếu ảnh khuôn mặt với giấy tờ để mở Ví ABC.",
		items: [
			"D-HOTEN",
			"D-CCCD",
			"D-SINHTRAC"
		],
		scope: "Thu thập, đối chiếu một lần; lưu kết quả xác thực",
		retention: "5 năm theo quy định thanh toán [KC]",
		updatedAt: "2026-09-02T03:00:00Z"
	}),
	P$1({
		code: "PARTNER-INS",
		name: "Chia sẻ đối tác bảo hiểm",
		status: "Chờ duyệt",
		desc: "Chia sẻ thông tin liên hệ cho đối tác để tư vấn bảo hiểm sức khỏe.",
		items: [
			"D-HOTEN",
			"D-SDT",
			"D-NGAYSINH"
		],
		scope: "Chia sẻ cho bên thứ ba",
		share: true,
		recipients: ["Công ty Bảo hiểm XYZ"],
		updatedAt: "2026-10-26T02:10:00Z",
		req: {
			action: "Tạo mới",
			by: "Phạm Minh",
			byRole: "Nhân viên",
			at: "2026-10-26T02:10:00Z"
		},
		history: [h("2026-10-26T02:10:00Z", "Phạm Minh", "Gửi duyệt")]
	}),
	P$1({
		code: "NEARBY-STORE",
		name: "Gợi ý cửa hàng gần bạn",
		status: "Nháp",
		desc: "Dùng vị trí để gợi ý cửa hàng gần nhất trên ứng dụng.",
		items: ["D-VITRI"],
		scope: "Sử dụng tức thời, không lưu lịch sử vị trí",
		updatedAt: "2026-10-24T10:45:00Z",
		history: [h("2026-10-24T10:45:00Z", "Lê Quang Huy", "Lưu nháp")]
	}),
	P$1({
		code: "HEALTH-ADVICE",
		name: "Tư vấn sản phẩm chăm sóc sức khỏe",
		status: "Bị trả lại",
		desc: "Tư vấn thực phẩm chức năng theo tình trạng sức khỏe khách khai báo.",
		items: ["D-HOTEN", "D-SUCKHOE"],
		scope: "Sử dụng để tư vấn",
		returnNote: "Cần nêu rõ thời hạn xử lý và không chia sẻ cho bên thứ ba.",
		updatedAt: "2026-10-22T08:00:00Z",
		history: [h("2026-10-21T04:00:00Z", "Lê Quang Huy", "Gửi duyệt"), h("2026-10-22T08:00:00Z", "Nguyễn Minh Thu", "Trả lại", "Cần nêu rõ thời hạn xử lý và không chia sẻ cho bên thứ ba.")]
	}),
	P$1({
		code: "MKT-SMS-OLD",
		name: "Tin nhắn SMS khuyến mãi (chương trình cũ)",
		status: "Ngừng sử dụng",
		desc: "Chương trình SMS khuyến mãi 2025.",
		items: ["D-SDT"],
		updatedAt: "2026-04-01T03:00:00Z"
	})
];
PURPOSES.forEach((p) => {
	if (p.everActive) p.versions = [{
		v: 1,
		at: p.updatedAt,
		by: "Nguyễn Minh Thu",
		snap: snapPurpose(p)
	}];
});
function snapPurpose(p) {
	return {
		"Tên": p.name,
		"Mô tả": p.desc,
		"Loại dữ liệu": p.items.map((c) => itemByCode(c)?.name || c),
		"Phạm vi xử lý": p.scope,
		"Cơ sở pháp lý": p.legalBasis,
		"Thời hạn xử lý": p.retention,
		"Chia sẻ": p.share ? "Có" : "Không",
		"Bên nhận": p.recipients,
		"Trẻ em": p.child ? "Có" : "Không"
	};
}
function Cn(o) {
	return {
		channels: ["Web"],
		apps: ["app_7Q2K9M"],
		duration: null,
		everActive: [
			"Hoạt động",
			"Chờ duyệt ngừng",
			"Ngừng sử dụng"
		].includes(o.status),
		history: [],
		versions: [],
		updatedAt: "2026-06-01T03:00:00Z",
		...o
	};
}
var CONSENTS = [
	Cn({
		code: "CS-MEMBER-REG",
		name: "Đăng ký thành viên",
		status: "Hoạt động",
		purposes: ["MEMBER-CORE"],
		kind: "Bắt buộc",
		channels: [
			"Web",
			"App",
			"Form nghiệp vụ"
		],
		apps: ["app_3HX81P", "app_5MB20R"],
		updatedAt: "2026-05-21T03:00:00Z"
	}),
	Cn({
		code: "CS-MKT-EMAIL",
		name: "Nhận ưu đãi qua email",
		status: "Hoạt động",
		purposes: ["MKT-EMAIL"],
		kind: "Tùy chọn",
		channels: [
			"Web",
			"App",
			"Form nghiệp vụ",
			"Ngoại tuyến"
		],
		apps: ["app_3HX81P", "app_5MB20R"],
		duration: 24,
		updatedAt: "2026-06-11T03:00:00Z"
	}),
	Cn({
		code: "CS-MKT-PERSONAL",
		name: "Gợi ý sản phẩm cá nhân hóa",
		status: "Hoạt động",
		purposes: ["MKT-PERSONAL"],
		kind: "Tùy chọn",
		channels: ["Web", "App"],
		apps: [
			"app_7Q2K9M",
			"app_3HX81P",
			"app_5MB20R"
		],
		duration: 12,
		updatedAt: "2026-08-29T03:00:00Z"
	}),
	Cn({
		code: "CS-ANALYTICS",
		name: "Cookie đo lường truy cập",
		status: "Hoạt động",
		purposes: ["ANALYTICS"],
		kind: "Tùy chọn",
		channels: ["Web"],
		apps: ["app_7Q2K9M", "app_3HX81P"],
		duration: 12,
		updatedAt: "2026-06-12T03:00:00Z"
	}),
	Cn({
		code: "CS-EKYC",
		name: "Xác thực danh tính mở Ví ABC",
		status: "Hoạt động",
		purposes: ["EKYC"],
		kind: "Tùy chọn",
		channels: ["Form nghiệp vụ", "App"],
		apps: ["app_3HX81P", "app_5MB20R"],
		updatedAt: "2026-09-03T03:00:00Z"
	}),
	Cn({
		code: "CS-MKT-ZALO",
		name: "Nhận ưu đãi qua Zalo OA",
		status: "Chờ duyệt",
		purposes: ["MKT-EMAIL"],
		kind: "Tùy chọn",
		channels: ["App"],
		apps: ["app_5MB20R"],
		duration: 24,
		updatedAt: "2026-10-27T03:20:00Z",
		req: {
			action: "Tạo mới",
			by: "Lê Quang Huy",
			byRole: "Nhân viên",
			at: "2026-10-27T03:20:00Z"
		},
		history: [h("2026-10-27T03:20:00Z", "Lê Quang Huy", "Gửi duyệt")]
	}),
	Cn({
		code: "CS-NEARBY",
		name: "Gợi ý cửa hàng gần bạn",
		status: "Nháp",
		purposes: [],
		kind: "Tùy chọn",
		channels: ["App"],
		apps: ["app_5MB20R"],
		updatedAt: "2026-10-24T10:50:00Z"
	}),
	Cn({
		code: "CS-MKT-SMS-OLD",
		name: "SMS khuyến mãi 2025",
		status: "Ngừng sử dụng",
		purposes: ["MKT-SMS-OLD"],
		kind: "Tùy chọn",
		channels: ["Ngoại tuyến"],
		apps: [],
		updatedAt: "2026-04-01T03:00:00Z"
	})
];
function snapConsent(c) {
	return {
		"Tên": c.name,
		"Mục đích": c.purposes,
		"Loại": c.kind,
		"Kênh": c.channels,
		"Ứng dụng": c.apps.map((a) => APPS.find((x) => x.id === a)?.name || a),
		"Thời hạn (tháng)": c.duration ?? "Mặc định [N]"
	};
}
CONSENTS.forEach((c) => {
	if (c.everActive) c.versions = [{
		v: 1,
		at: c.updatedAt,
		by: "Nguyễn Minh Thu",
		snap: snapConsent(c)
	}];
});
function buildContent(c, lang) {
	const ps = c.purposes.map((code) => PURPOSES.find((p) => p.code === code)).filter(Boolean);
	const items = [...new Set(ps.flatMap((p) => p.items))].map((i) => itemByCode(i)?.name || i);
	const rec = [...new Set(ps.flatMap((p) => p.recipients))];
	if (lang === "en") return {
		data: `Personal data: ${items.length} data types as listed in the ABC Retail data catalogue.`,
		purpose: ps.map((p) => p.code).join(", ") + " – see purpose descriptions.",
		parties: `Controller: ABC Retail JSC. ${rec.length ? "Recipients: " + rec.join("; ") + "." : "No third-party sharing."}`,
		rights: "You may access, correct, delete, restrict, object and withdraw consent at any time via the Preference Center."
	};
	return {
		data: `Dữ liệu cá nhân xử lý: ${items.join(", ")}.`,
		purpose: ps.map((p) => `${p.name}: ${p.desc}`).join(" "),
		parties: `Bên kiểm soát: Công ty Cổ phần ABC Retail. ${rec.length ? "Bên nhận: " + rec.join("; ") + "." : "Không chia sẻ cho bên thứ ba."}`,
		rights: "Bạn có quyền được biết, xem, chỉnh sửa, xóa, hạn chế xử lý, phản đối và rút lại sự đồng ý bất cứ lúc nào tại Trang tùy chọn (Preference Center)."
	};
}
function N(consent, v, status, o = {}) {
	const c = CONSENTS.find((x) => x.code === consent);
	const content = {
		vi: buildContent(c, "vi"),
		en: buildContent(c, "en")
	};
	const base = {
		id: `${consent}|${v}`,
		consent,
		v,
		sum: "Phiên bản đầu",
		content,
		status,
		by: "Phạm Minh",
		at: "2026-06-01T03:00:00Z",
		everSent: status !== "Nháp",
		...o
	};
	if ([
		"Published",
		"Expired",
		"Đã duyệt – chờ hiệu lực"
	].includes(status) && !base.hash) base.hash = fakeHash(JSON.stringify(base.content) + v);
	return base;
}
var NOTICES = [
	N("CS-MEMBER-REG", "v1.0", "Expired", {
		at: "2026-05-21T03:00:00Z",
		approvedBy: "Nguyễn Minh Thu",
		effectiveAt: "2026-05-21T03:00:00Z",
		material: "Có"
	}),
	N("CS-MEMBER-REG", "v1.1", "Published", {
		sum: "Bổ sung quyền rút lại đồng ý",
		at: "2026-07-02T03:00:00Z",
		approvedBy: "Nguyễn Minh Thu",
		effectiveAt: "2026-07-03T00:00:00Z",
		material: "Không"
	}),
	N("CS-MKT-EMAIL", "v2.0", "Published", {
		sum: "Thêm lịch sử mua hàng để cá nhân hóa ưu đãi",
		at: "2026-06-11T03:00:00Z",
		approvedBy: "Nguyễn Minh Thu",
		effectiveAt: "2026-06-12T00:00:00Z",
		material: "Có"
	}),
	N("CS-MKT-EMAIL", "v2.1", "Chờ duyệt", {
		sum: "Sửa câu chữ phần quyền của chủ thể, thêm tiếng Anh",
		by: "Lê Quang Huy",
		at: "2026-10-26T09:05:00Z",
		suggested: "Không",
		req: {
			action: "Xuất bản",
			by: "Lê Quang Huy",
			byRole: "Nhân viên",
			at: "2026-10-26T09:05:00Z"
		}
	}),
	N("CS-MKT-PERSONAL", "v1.0", "Expired", {
		at: "2026-06-01T03:00:00Z",
		approvedBy: "Nguyễn Minh Thu",
		material: "Có"
	}),
	N("CS-MKT-PERSONAL", "v1.1", "Published", {
		sum: "Thêm bên nhận Meta, TikTok",
		at: "2026-08-29T03:00:00Z",
		approvedBy: "Nguyễn Minh Thu",
		effectiveAt: "2026-08-30T00:00:00Z",
		material: "Có"
	}),
	N("CS-ANALYTICS", "v1.2", "Published", {
		sum: "Cập nhật thời hạn cookie 13 tháng",
		at: "2026-06-12T03:00:00Z",
		approvedBy: "Nguyễn Minh Thu",
		effectiveAt: "2026-06-12T05:00:00Z",
		material: "Không"
	}),
	N("CS-EKYC", "v1.0", "Published", {
		at: "2026-09-03T03:00:00Z",
		approvedBy: "Nguyễn Minh Thu",
		effectiveAt: "2026-09-03T05:00:00Z",
		material: "Có"
	}),
	N("CS-MKT-ZALO", "v1.0", "Nháp", {
		by: "Lê Quang Huy",
		at: "2026-10-27T03:25:00Z"
	})
];
var CFG = (kind, o = {}) => ({
	layout: kind === "cookie" ? "bar" : "center",
	title: kind === "cookie" ? {
		vi: "Chúng tôi tôn trọng quyền riêng tư của bạn",
		en: "We respect your privacy"
	} : {
		vi: "Đồng ý xử lý dữ liệu cá nhân",
		en: "Consent to personal data processing"
	},
	desc: kind === "cookie" ? {
		vi: "ABC Mart dùng cookie để website hoạt động, đo lượt truy cập và gợi ý sản phẩm phù hợp. Bạn có thể chấp nhận, từ chối hoặc chọn từng nhóm.",
		en: "ABC Mart uses cookies to run the site, measure traffic and personalise products. You can accept, reject or choose each group."
	} : {
		vi: "ABC Mart cần thông tin dưới đây để cung cấp dịch vụ. Các mục tùy chọn bạn có thể đổi ý bất cứ lúc nào.",
		en: "ABC Mart needs the information below to provide the service. You can change optional items at any time."
	},
	reject: kind === "cookie" ? {
		vi: "Từ chối tất cả",
		en: "Reject all"
	} : {
		vi: "Từ chối",
		en: "Reject"
	},
	custom: kind === "cookie" ? {
		vi: "Tùy chỉnh",
		en: "Customise"
	} : {
		vi: "Xem chi tiết",
		en: "Details"
	},
	accept: kind === "cookie" ? {
		vi: "Chấp nhận tất cả",
		en: "Accept all"
	} : {
		vi: "Đồng ý",
		en: "Accept"
	},
	link: {
		vi: "Chính sách quyền riêng tư",
		en: "Privacy policy"
	},
	color: "#2457C5",
	textColor: "#FFFFFF",
	radius: 8,
	logo: true,
	font: "Be Vietnam Pro",
	consents: [],
	langs: ["vi", "en"],
	...o
});
var LAYOUTS = {
	center: "Hộp giữa màn hình",
	inline: "Nhúng trong form",
	sheet: "Trượt từ dưới (di động)",
	bar: "Thanh dưới trang",
	corner: "Thẻ góc trái dưới"
};
var BANNERS = [
	{
		code: "BN-001",
		name: "Popup đăng ký thành viên",
		kind: "consent",
		site: "member.abcmart.vn",
		versions: [{
			v: 2,
			status: "Hoạt động",
			at: "2026-10-02T02:40:00Z",
			by: "Lê Quang Huy",
			ap: "Nguyễn Minh Thu",
			note: "Thêm mục gợi ý cá nhân hóa",
			cfg: CFG("consent", { consents: [
				"CS-MEMBER-REG",
				"CS-MKT-EMAIL",
				"CS-MKT-PERSONAL"
			] })
		}, {
			v: 1,
			status: "Thay thế",
			at: "2026-07-01T03:10:00Z",
			by: "Phạm Minh",
			ap: "Nguyễn Minh Thu",
			note: "Tạo mới",
			cfg: CFG("consent", {
				consents: ["CS-MEMBER-REG", "CS-MKT-EMAIL"],
				title: {
					vi: "Đăng ký thành viên",
					en: "Membership sign-up"
				}
			})
		}]
	},
	{
		code: "BN-002",
		name: "Form mở ví thành viên (eKYC)",
		kind: "consent",
		site: "member.abcmart.vn",
		versions: [{
			v: 1,
			status: "Hoạt động",
			at: "2026-09-03T04:30:00Z",
			by: "Phạm Minh",
			ap: "Nguyễn Minh Thu",
			note: "Tạo mới",
			cfg: CFG("consent", {
				layout: "inline",
				consents: ["CS-EKYC"],
				title: {
					vi: "Xác thực danh tính để mở Ví ABC",
					en: "Verify your identity to open ABC Wallet"
				}
			})
		}]
	},
	{
		code: "BN-003",
		name: "Hỏi quyền vị trí trên ứng dụng",
		kind: "consent",
		site: "Ứng dụng ABC Mart",
		versions: [{
			v: 1,
			status: "Nháp",
			at: "2026-10-24T10:45:00Z",
			by: "Lê Quang Huy",
			note: "Bản nháp",
			cfg: CFG("consent", {
				layout: "sheet",
				consents: [],
				title: {
					vi: "Gợi ý cửa hàng gần bạn",
					en: "Stores near you"
				}
			})
		}]
	},
	{
		code: "BN-004",
		name: "Popup chia sẻ đối tác bảo hiểm",
		kind: "consent",
		site: "abcmart.vn",
		versions: [{
			v: 1,
			status: "Bị trả lại",
			at: "2026-10-22T02:00:00Z",
			by: "Phạm Minh",
			ap: "Nguyễn Minh Thu",
			note: "Tạo mới",
			retNote: "Nút Từ chối có màu nhạt hơn nút Đồng ý, vi phạm BR-UC07-02.",
			cfg: CFG("consent", {
				color: "#7FA3E8",
				textColor: "#FFFFFF",
				consents: []
			})
		}]
	},
	{
		code: "CK-001",
		name: "Banner cookie abcmart.vn",
		kind: "cookie",
		site: "abcmart.vn",
		versions: [
			{
				v: 5,
				status: "Chờ duyệt",
				at: "2026-10-26T02:15:00Z",
				by: "Lê Quang Huy",
				note: "Đổi tiêu đề và nhãn nút",
				cfg: CFG("cookie", { consents: ["CS-ANALYTICS", "CS-MKT-PERSONAL"] }),
				req: {
					action: "Xuất bản",
					by: "Lê Quang Huy",
					byRole: "Nhân viên",
					at: "2026-10-26T02:15:00Z"
				}
			},
			{
				v: 4,
				status: "Hoạt động",
				at: "2026-08-28T03:02:00Z",
				by: "Lê Quang Huy",
				ap: "Nguyễn Minh Thu",
				note: "Thêm nhóm cá nhân hóa",
				cfg: CFG("cookie", {
					consents: ["CS-ANALYTICS", "CS-MKT-PERSONAL"],
					title: {
						vi: "Website sử dụng cookie",
						en: "This website uses cookies"
					},
					custom: {
						vi: "Cài đặt",
						en: "Settings"
					}
				})
			},
			{
				v: 3,
				status: "Thay thế",
				at: "2026-06-12T07:30:00Z",
				by: "Phạm Minh",
				ap: "Nguyễn Minh Thu",
				note: "Tạo mới",
				cfg: CFG("cookie", {
					consents: ["CS-ANALYTICS"],
					title: {
						vi: "Website sử dụng cookie",
						en: "This website uses cookies"
					}
				})
			}
		]
	},
	{
		code: "CK-002",
		name: "Banner cookie member.abcmart.vn",
		kind: "cookie",
		site: "member.abcmart.vn",
		versions: [{
			v: 1,
			status: "Hoạt động",
			at: "2026-09-05T04:00:00Z",
			by: "Phạm Minh",
			ap: "Nguyễn Minh Thu",
			note: "Tạo mới",
			cfg: CFG("cookie", {
				layout: "corner",
				consents: ["CS-ANALYTICS"]
			})
		}]
	}
];
[
	[
		"cmp_consent_id",
		"abcmart.vn",
		"CMP",
		"12 tháng",
		"Thiết yếu"
	],
	[
		"session_id",
		"abcmart.vn",
		"ABC Mart",
		"Phiên",
		"Thiết yếu"
	],
	[
		"_ga",
		".abcmart.vn",
		"Google Analytics",
		"13 tháng",
		"CS-ANALYTICS"
	],
	[
		"_clck",
		".abcmart.vn",
		"Microsoft Clarity",
		"12 tháng",
		"CS-ANALYTICS"
	],
	[
		"_fbp",
		".abcmart.vn",
		"Meta Pixel",
		"3 tháng",
		"CS-MKT-PERSONAL"
	],
	[
		"_ttp",
		".abcmart.vn",
		"TikTok",
		"13 tháng",
		"CS-MKT-PERSONAL"
	]
].map(([name, dom, prov, ttl, grp]) => ({
	name,
	dom,
	prov,
	ttl,
	grp
}));
var USERS = [
	{
		id: 1,
		name: "Trần Hoàng Long",
		email: "long.tran@abc-retail.vn",
		roles: ["Admin"],
		dept: "Công nghệ",
		scope: "Toàn tổ chức",
		status: "Hoạt động",
		last: "2026-10-28T01:30:00Z"
	},
	{
		id: 2,
		name: "Nguyễn Minh Thu",
		email: "thu.nguyen@abc-retail.vn",
		roles: ["DPO"],
		dept: "Ban Bảo vệ dữ liệu",
		scope: "Toàn tổ chức",
		status: "Hoạt động",
		last: "2026-10-28T01:05:00Z"
	},
	{
		id: 3,
		name: "Lê Quang Huy",
		email: "huy.le@abc-retail.vn",
		roles: ["Nhân viên"],
		dept: "Marketing",
		scope: "abcmart.vn",
		status: "Hoạt động",
		last: "2026-10-27T10:20:00Z"
	},
	{
		id: 4,
		name: "Phạm Minh",
		email: "minh.pham@abc-retail.vn",
		roles: ["Nhân viên"],
		dept: "Sản phẩm số",
		scope: "member.abcmart.vn",
		status: "Hoạt động",
		last: "2026-10-26T04:40:00Z"
	},
	{
		id: 5,
		name: "Phạm Thu Trang",
		email: "trang.pham@abc-retail.vn",
		roles: ["Nhân viên", "DPO"],
		dept: "Chăm sóc khách hàng",
		scope: "Toàn tổ chức",
		status: "Hoạt động",
		last: "2026-10-28T01:15:00Z"
	},
	{
		id: 6,
		name: "Vũ Ngọc Ánh",
		email: "anh.vu@abc-retail.vn",
		roles: ["DPO"],
		dept: "Pháp chế",
		scope: "Toàn tổ chức",
		status: "Chờ kích hoạt",
		last: ""
	}
];
var UAS = [
	"Chrome 130 · Windows 11",
	"Safari 18 · iOS 18",
	"Chrome 130 · Android 15",
	"Edge 130 · Windows 11",
	"ABC Mart App 5.2 · iOS 18",
	"ABC Mart App 5.2 · Android 15"
];
var TODAY = /* @__PURE__ */ new Date("2026-10-28T03:00:00Z");
var r = rng(20261028);
var pick = (a) => a[Math.floor(r() * a.length)];
var evSeq = 1;
var mkReceipt = (decision, app) => ({
	jti: "rcp_" + fakeHash("j" + evSeq).slice(0, 16),
	kid: "cmp-2026-07",
	alg: "ES256",
	enc: "RSA-OAEP-256 / A256GCM",
	aud: app,
	exp: "[N] giây (OI-04)",
	decision
});
function ev(o) {
	const id = `EV-${String(1e5 + evSeq++)}`;
	const app = o.app || "app_3HX81P";
	const notice = NOTICES.filter((n) => n.consent === o.consent && (n.status === "Published" || n.status === "Expired")).sort((a, b) => (a.effectiveAt || a.at) < (b.effectiveAt || b.at) ? 1 : -1).find((n) => (n.effectiveAt || n.at) <= o.ts) || NOTICES.find((n) => n.consent === o.consent);
	const e = {
		id,
		version: notice?.v || "v1.0",
		channel: "Web",
		app,
		property: APPS.find((a) => a.id === app)?.property || "abcmart.vn",
		source: "Trực tuyến",
		hash: notice?.hash || fakeHash(o.consent),
		tx: "tx_" + fakeHash(id).slice(0, 12),
		ip: `113.161.${Math.floor(r() * 250)}.${Math.floor(r() * 250)}`,
		ua: pick(UAS),
		...o
	};
	if (!o.receipt && (e.decision === "ACCEPTED" || e.decision === "REJECTED") && e.source !== "Liên kết từ cookie" && e.consent !== "CS-ANALYTICS" && e.source !== "Legacy" && e.source !== "Ngoại tuyến") e.receipt = mkReceipt(e.decision, app);
	return e;
}
var iso = (daysAgo, hour = 9) => {
	const d = /* @__PURE__ */ new Date(TODAY.getTime() - daysAgo * 864e5);
	d.setUTCHours(hour - 7 + Math.floor(r() * 9), Math.floor(r() * 60), Math.floor(r() * 60));
	return d.toISOString();
};
var SUBJECTS = [];
var EVENTS = [];
for (let i = 0; i < 160; i++) {
	const s = "KH" + String(12301 + i * 7).padStart(7, "0");
	SUBJECTS.push(s);
	const d0 = Math.floor(r() * 88) + 1;
	const app = r() < .6 ? "app_3HX81P" : "app_5MB20R";
	const ch = app === "app_5MB20R" ? "App" : "Form nghiệp vụ";
	const anon = r() < .45 ? "ck_" + fakeHash(s).slice(0, 4) + "…" + fakeHash(s).slice(-2) : void 0;
	if (anon) {
		const dA = Math.min(89, d0 + Math.floor(r() * 5) + 1);
		EVENTS.push(ev({
			subject: s,
			consent: "CS-ANALYTICS",
			decision: r() < .62 ? "ACCEPTED" : "REJECTED",
			ts: iso(dA),
			app: "app_7Q2K9M",
			channel: "Web",
			source: "Liên kết từ cookie",
			linkedFrom: anon
		}));
	}
	EVENTS.push(ev({
		subject: s,
		consent: "CS-MEMBER-REG",
		decision: "ACCEPTED",
		ts: iso(d0),
		app,
		channel: ch
	}));
	const em = r() < .71 ? "ACCEPTED" : "REJECTED";
	EVENTS.push(ev({
		subject: s,
		consent: "CS-MKT-EMAIL",
		decision: em,
		ts: iso(d0),
		app,
		channel: ch
	}));
	if (em === "ACCEPTED" && r() < .12 && d0 > 3) EVENTS.push(ev({
		subject: s,
		consent: "CS-MKT-EMAIL",
		decision: "WITHDRAWN",
		ts: iso(Math.floor(d0 / 2)),
		app: "app_3HX81P",
		channel: "Preference Center",
		source: "Preference Center"
	}));
	if (r() < .8) {
		const dp = r() < .15 && d0 > 60 ? d0 : d0;
		EVENTS.push(ev({
			subject: s,
			consent: "CS-MKT-PERSONAL",
			decision: r() < .56 ? "ACCEPTED" : "REJECTED",
			ts: iso(dp),
			app,
			channel: ch
		}));
	}
	if (r() < .25 && d0 < 55) EVENTS.push(ev({
		subject: s,
		consent: "CS-EKYC",
		decision: r() < .83 ? "ACCEPTED" : "REJECTED",
		ts: iso(d0),
		app,
		channel: "Form nghiệp vụ",
		sensitive: true,
		explicitConfirm: true
	}));
}
for (let i = 0; i < 220; i++) {
	const ck = "ck_" + fakeHash("anon" + i).slice(0, 4) + "…" + fakeHash("anon" + i).slice(-2);
	EVENTS.push(ev({
		subject: ck,
		consent: "CS-ANALYTICS",
		decision: r() < .6 ? "ACCEPTED" : "REJECTED",
		ts: iso(Math.floor(r() * 89) + 1),
		app: "app_7Q2K9M",
		channel: "Web"
	}));
}
SUBJECTS.slice(0, 18).forEach((s, i) => {
	EVENTS.push(ev({
		subject: s,
		consent: "CS-MKT-EMAIL",
		decision: "ACCEPTED",
		ts: `2025-0${i % 9 + 1}-1${i % 9}T03:00:00Z`,
		channel: "Import",
		app: "—",
		property: "member.abcmart.vn",
		source: "Legacy",
		legacyBatch: "LOT-2026-001",
		legacyRisk: i % 5 === 0,
		version: "Legacy",
		hash: fakeHash("legacy" + s)
	}));
});
[
	{
		s: SUBJECTS[3],
		c: "CS-MKT-EMAIL",
		k: "Văn bản, chữ ký",
		f: "phieu-dang-ky-cua-hang-Q3.pdf",
		d: 6
	},
	{
		s: SUBJECTS[11],
		c: "CS-MKT-EMAIL",
		k: "Ghi âm",
		f: "cuoc-goi-CSKH-0912.m4a",
		d: 4
	},
	{
		s: SUBJECTS[25],
		c: "CS-MKT-PERSONAL",
		k: "SMS",
		f: "sms-cu-phap-DY-PERSONAL.png",
		d: 2
	},
	{
		s: SUBJECTS[40],
		c: "CS-MEMBER-REG",
		k: "Văn bản, chữ ký",
		f: "phieu-thanh-vien-quay-12.pdf",
		d: 1
	}
].forEach((o, i) => {
	const ts = iso(o.d, 15);
	EVENTS.push(ev({
		subject: o.s,
		consent: o.c,
		decision: "ACCEPTED",
		ts,
		channel: "Ngoại tuyến",
		app: "—",
		property: "Cửa hàng, tổng đài",
		source: "Ngoại tuyến",
		ip: "—",
		ua: "Nhập tại CMP Console",
		offline: {
			id: `OFF-${String(226 + i).padStart(6, "0")}`,
			kind: o.k,
			actualDate: (/* @__PURE__ */ new Date(new Date(ts).getTime() - 864e5)).toISOString().slice(0, 10),
			enteredBy: "Phạm Thu Trang",
			files: [{
				name: o.f,
				size: `${(.4 + i * .7).toFixed(1)} MB`,
				hash: fakeHash(o.f)
			}]
		}
	}));
});
EVENTS.sort((a, b) => a.ts < b.ts ? 1 : -1);
var AUDIT = [
	{
		at: "2026-10-28T01:05:00Z",
		who: "Nguyễn Minh Thu",
		role: "DPO",
		act: "Đăng nhập",
		obj: "Console",
		res: "ok",
		det: "SSO + MFA"
	},
	{
		at: "2026-10-27T03:20:00Z",
		who: "Lê Quang Huy",
		role: "Nhân viên",
		act: "Gửi duyệt",
		obj: "Consent CS-MKT-ZALO",
		res: "ok"
	},
	{
		at: "2026-10-26T09:05:00Z",
		who: "Lê Quang Huy",
		role: "Nhân viên",
		act: "Gửi duyệt",
		obj: "Phiên bản thông báo CS-MKT-EMAIL v2.1",
		res: "ok"
	},
	{
		at: "2026-10-26T08:10:00Z",
		who: "Hệ thống",
		role: "Hệ thống",
		act: "Gửi event",
		obj: "Hệ thống gửi email (ESP)",
		res: "err",
		det: "401 Unauthorized, quá [N] lần thử"
	},
	{
		at: "2026-10-26T02:15:00Z",
		who: "Lê Quang Huy",
		role: "Nhân viên",
		act: "Gửi duyệt",
		obj: "Banner CK-001 v5",
		res: "ok"
	},
	{
		at: "2026-10-26T02:10:00Z",
		who: "Phạm Minh",
		role: "Nhân viên",
		act: "Gửi duyệt",
		obj: "Mục đích PARTNER-INS",
		res: "ok"
	},
	{
		at: "2026-10-24T03:02:00Z",
		who: "Lê Quang Huy",
		role: "Nhân viên",
		act: "Sửa ma trận phân quyền",
		obj: "Vai trò Admin",
		res: "err",
		det: "403 – không đủ quyền"
	},
	{
		at: "2026-10-22T08:00:00Z",
		who: "Nguyễn Minh Thu",
		role: "DPO",
		act: "Trả lại",
		obj: "Mục đích HEALTH-ADVICE",
		res: "ok",
		det: "Cần nêu rõ thời hạn xử lý…"
	},
	{
		at: "2026-07-01T03:00:00Z",
		who: "Nguyễn Minh Thu",
		role: "DPO",
		act: "Phê duyệt",
		obj: "Danh mục dữ liệu v2",
		res: "ok"
	}
];
var NLOG = [{
	id: "N-1",
	to: "Lê Quang Huy",
	at: "2026-10-22T08:00:00Z",
	text: "Mục đích HEALTH-ADVICE bị trả lại: Cần nêu rõ thời hạn xử lý và không chia sẻ cho bên thứ ba.",
	link: "/purposes",
	read: false,
	tone: "err"
}, {
	id: "N-2",
	to: "Phạm Minh",
	at: "2026-10-22T02:30:00Z",
	text: "Banner BN-004 v1 bị trả lại: nút Từ chối nhạt hơn nút Đồng ý.",
	link: "/banners/BN-004",
	read: false,
	tone: "err"
}];
var ALERTS = [
	{
		id: "AL-0412",
		sev: "Nghiêm trọng",
		type: "Connector gửi lỗi (NT-08)",
		src: "Hệ thống gửi email (ESP) · 2 event FAILED",
		at: "2026-10-26T08:10:00Z",
		to: ["Admin"],
		status: "Đang mở",
		link: "/integrations"
	},
	{
		id: "AL-0411",
		sev: "Nghiêm trọng",
		type: "Khóa ký sắp hết hạn (NT-09)",
		src: "kid cmp-2025-01 · hết hạn 30/10/2026",
		at: "2026-10-25T01:00:00Z",
		to: ["Admin"],
		status: "Đang mở",
		link: "/settings"
	},
	{
		id: "AL-0409",
		sev: "Cảnh báo",
		type: "Yêu cầu quyền quá hạn (NT-07)",
		src: "RQ-2026-00405 · Hạn chế xử lý",
		at: "2026-10-24T01:00:00Z",
		to: ["Nhân viên", "DPO"],
		status: "Đang mở",
		link: "/rights"
	},
	{
		id: "AL-0402",
		sev: "Thông tin",
		type: "Quét cookie có mục chưa phân loại",
		src: "abcmart.vn · 2 tracker mới",
		at: "2026-10-20T02:00:00Z",
		to: ["Admin"],
		status: "Đã xử lý",
		link: "/integrations",
		note: "Đã chuyển nhóm Thiết yếu cho DPO duyệt"
	}
];
var IMPORTS = [{
	id: "LOT-2026-001",
	file: "consent-email-2025.xlsx",
	at: "2026-09-10T03:00:00Z",
	by: "Phạm Minh",
	rows: 1250,
	ok: 1218,
	err: 18,
	risk: 14,
	status: "Đã ghi",
	riskRows: [],
	errRows: []
}, {
	id: "LOT-2026-002",
	file: "consent-cua-hang-T9.csv",
	at: "2026-10-25T04:30:00Z",
	by: "Phạm Thu Trang",
	rows: 342,
	ok: 326,
	err: 9,
	risk: 7,
	status: "Chờ duyệt",
	req: {
		action: "Ghi lô",
		by: "Phạm Thu Trang",
		byRole: "Nhân viên",
		at: "2026-10-25T04:30:00Z"
	},
	riskRows: [
		12,
		37,
		58,
		101,
		144,
		210,
		299
	].map((row, i) => ({
		row,
		subject: SUBJECTS[60 + i],
		consent: "CS-MKT-EMAIL",
		date: `2025-0${i % 8 + 1}-15`,
		issue: i % 2 ? "Thiếu tệp bằng chứng gốc" : "Không có phiên bản thông báo tương ứng"
	})),
	errRows: [
		{
			row: 8,
			issue: "Mã khách hàng rỗng"
		},
		{
			row: 44,
			issue: "Ngày đồng ý sai định dạng"
		},
		{
			row: 90,
			issue: "consent_code không tồn tại: CS-MKT"
		}
	]
}];
var RECONSENT_RULES = [{
	version: 3,
	status: "Hoạt động",
	defaultMonths: 24,
	at: "2026-09-03T05:00:00Z",
	by: "Lê Quang Huy",
	approvedBy: "Nguyễn Minh Thu",
	approvedAt: "2026-09-03T05:00:00Z",
	history: [{
		at: "2026-09-03T05:00:00Z",
		who: "Nguyễn Minh Thu",
		act: "Phê duyệt",
		note: "Kích hoạt bộ quy tắc R3"
	}],
	rows: [
		[
			"Thêm mục đích xử lý mới",
			true,
			true
		],
		[
			"Thêm bên nhận dữ liệu",
			true,
			true
		],
		[
			"Thêm loại dữ liệu",
			true,
			true
		],
		[
			"Kéo dài thời hạn lưu trữ",
			true,
			true
		],
		[
			"Thêm loại dữ liệu nhạy cảm",
			true,
			true
		],
		[
			"Sửa câu chữ, lỗi chính tả",
			false,
			false
		],
		[
			"Bổ sung bản dịch tiếng Anh",
			false,
			false
		],
		[
			"Rút ngắn thời hạn lưu trữ",
			false,
			false
		],
		[
			"Đổi thông tin liên hệ của bên kiểm soát",
			false,
			false
		],
		[
			"Bỏ bớt bên nhận",
			false,
			false
		]
	].map(([change, material, locked]) => ({
		change: String(change),
		material: Boolean(material),
		locked: Boolean(locked)
	}))
}];
var MATRIX = [{
	app: "app_3HX81P",
	version: 3,
	status: "Hoạt động",
	approvedBy: "Nguyễn Minh Thu",
	approvedAt: "2026-09-03T05:00:00Z",
	at: "2026-09-03T05:00:00Z",
	by: "Lê Quang Huy",
	history: [{
		at: "2026-09-03T05:00:00Z",
		who: "Nguyễn Minh Thu",
		act: "Phê duyệt",
		note: "Kích hoạt ma trận v3"
	}],
	onReject: "Chặn chức năng liên quan",
	rows: [
		{
			fn: "FN-01",
			name: "Đăng ký, đăng nhập thành viên",
			purposes: { "MEMBER-CORE": true }
		},
		{
			fn: "FN-02",
			name: "Mở Ví ABC (eKYC)",
			purposes: {
				"MEMBER-CORE": true,
				EKYC: true
			}
		},
		{
			fn: "FN-03",
			name: "Nhận ưu đãi qua email",
			purposes: { "MKT-EMAIL": false }
		},
		{
			fn: "FN-04",
			name: "Gợi ý sản phẩm trên trang chủ",
			purposes: { "MKT-PERSONAL": false }
		}
	]
}, {
	app: "app_5MB20R",
	version: 1,
	status: "Hoạt động",
	approvedBy: "Nguyễn Minh Thu",
	approvedAt: "2026-09-05T05:00:00Z",
	at: "2026-09-05T05:00:00Z",
	by: "Phạm Minh",
	history: [{
		at: "2026-09-05T05:00:00Z",
		who: "Nguyễn Minh Thu",
		act: "Phê duyệt",
		note: "Kích hoạt ma trận v1"
	}],
	onReject: "Chặn, cho phép luồng thay thế",
	rows: [{
		fn: "FN-01",
		name: "Đăng nhập ứng dụng",
		purposes: { "MEMBER-CORE": true }
	}, {
		fn: "FN-05",
		name: "Tìm cửa hàng gần nhất",
		purposes: {}
	}]
}];
[
	[
		"RQ-2026-00425",
		"Rút lại đồng ý",
		"2026-10-22T07:30:00Z",
		"WAITING_PROCESSOR",
		"Phạm Thu Trang",
		"06/11/2026"
	],
	[
		"RQ-2026-00421",
		"Sửa dữ liệu",
		"2026-10-20T02:20:00Z",
		"IN_PROGRESS",
		"Lê Quang Huy",
		"04/11/2026"
	],
	[
		"RQ-2026-00412",
		"Xóa dữ liệu",
		"2026-10-12T02:14:00Z",
		"PENDING_CLOSE",
		"Phạm Thu Trang",
		"27/10/2026"
	],
	[
		"RQ-2026-00405",
		"Hạn chế xử lý",
		"2026-10-08T06:10:00Z",
		"IN_PROGRESS · Quá hạn",
		"Lê Quang Huy",
		"23/10/2026"
	],
	[
		"RQ-2026-00398",
		"Cung cấp dữ liệu",
		"2026-10-01T08:20:00Z",
		"COMPLETED",
		"Phạm Thu Trang",
		"16/10/2026"
	]
].map(([id, type, at, status, owner, due], i) => ({
	id,
	type,
	at,
	status,
	owner,
	due,
	subject: SUBJECTS[90 + i]
}));
//#endregion
//#region src/lib/perm.ts
/** Nhóm chức năng trong ma trận phân quyền (SRS 4.2, SCR-08-03) */
var MODULES = [
	["dash", "Dashboard"],
	["notif", "Chuông, Trung tâm thông báo"],
	["setup", "Mục đích, consent, phiên bản thông báo, quy tắc, ma trận phụ thuộc"],
	["banner", "Banner, popup"],
	["records", "Bản ghi, lịch sử consent, bằng chứng"],
	["evidence", "Xuất gói bằng chứng"],
	["offline", "Ghi nhận consent ngoại tuyến"],
	["import", "Import consent kế thừa"],
	["sim", "Mô phỏng thu thập consent"],
	["rights", "Yêu cầu quyền của chủ thể"],
	["users", "Người dùng, vai trò, phân quyền"],
	["audit", "Nhật ký kiểm toán"],
	["integ", "Ứng dụng T3, connector, event"],
	["settings", "Khóa ký, cảnh báo, lượng dùng"]
];
var P = (view, edit, approve) => ({
	view: !!view,
	edit: !!edit,
	approve: !!approve
});
/** Ma trận mặc định khi khởi tạo tenant (SRS 4.2). Admin mặc định KHÔNG có quyền Phê duyệt. */
var PERM_DEFAULT = {
	Admin: {
		dash: P(1, 0, 0),
		notif: P(1, 0, 0),
		setup: P(1, 1, 0),
		banner: P(1, 1, 0),
		records: P(1, 0, 0),
		evidence: P(0, 0, 0),
		offline: P(1, 0, 0),
		import: P(1, 1, 0),
		sim: P(1, 0, 0),
		rights: P(1, 0, 0),
		users: P(1, 1, 0),
		audit: P(1, 0, 0),
		integ: P(1, 1, 0),
		settings: P(1, 1, 0)
	},
	DPO: {
		dash: P(1, 0, 0),
		notif: P(1, 0, 0),
		setup: P(1, 0, 1),
		banner: P(1, 0, 1),
		records: P(1, 0, 0),
		evidence: P(1, 1, 0),
		offline: P(1, 0, 0),
		import: P(1, 0, 1),
		sim: P(1, 0, 0),
		rights: P(1, 0, 1),
		users: P(1, 0, 0),
		audit: P(1, 0, 0),
		integ: P(1, 0, 0),
		settings: P(1, 0, 0)
	},
	"Nhân viên": {
		dash: P(1, 0, 0),
		notif: P(1, 0, 0),
		setup: P(1, 1, 0),
		banner: P(1, 1, 0),
		records: P(1, 0, 0),
		evidence: P(0, 0, 0),
		offline: P(1, 1, 0),
		import: P(1, 1, 0),
		sim: P(1, 0, 0),
		rights: P(1, 1, 0),
		users: P(0, 0, 0),
		audit: P(0, 0, 0),
		integ: P(1, 0, 0),
		settings: P(0, 0, 0)
	}
};
var DENY = () => ({
	view: false,
	edit: false,
	approve: false
});
var DENY_ALL = Object.fromEntries(MODULES.map(([mod]) => [mod, DENY()]));
/**
* Resolve exactly one effective role inside the active tenant membership.
* Invalid, inactive or stale role context always fails closed.
*/
function resolveEffectivePermissions(membership, effectiveRole, matrix) {
	if (!membership || membership.status !== "ACTIVE" || !membership.roles.includes(effectiveRole)) return DENY_ALL;
	return matrix[effectiveRole] || DENY_ALL;
}
/** Preserve a requested role only when the target membership authorizes it. */
function resolveEffectiveRole(membership, requestedRole) {
	if (!membership || membership.status !== "ACTIVE") return null;
	return membership.roles.includes(requestedRole) ? requestedRole : membership.roles[0] || null;
}
function canWithEffectiveRole(membership, effectiveRole, matrix, mod, act = "view") {
	return resolveEffectivePermissions(membership, effectiveRole, matrix)[mod][act];
}
//#endregion
//#region src/lib/platform-data.ts
var PLATFORM_STORAGE_KEY = "cmp-platform-state-v1";
var PLATFORM_ACTORS = [
	{
		id: "platform-admin",
		name: "Phạm Gia Bảo",
		role: "Platform Administrator"
	},
	{
		id: "platform-viewer",
		name: "Hoàng Thanh Mai",
		role: "Platform Viewer"
	},
	{
		id: "tenant-only-admin",
		name: "Trần Hoàng Long",
		role: null
	}
];
var seedPlatformTenants = () => {
	const now = "2026-10-01T08:00:00.000Z";
	return [
		{
			id: "tenant-retail",
			code: "ABC-RETAIL",
			name: "ABC Retail",
			status: "ACTIVE",
			description: "Khối bán lẻ minh họa",
			contactEmail: "privacy@abcmart.vn",
			createdAt: "2026-07-01T03:00:00.000Z",
			updatedAt: now
		},
		{
			id: "tenant-finance",
			code: "ABC-FIN",
			name: "ABC Finance",
			status: "ACTIVE",
			description: "Khối tài chính minh họa",
			contactEmail: "privacy@abcfinance.vn",
			createdAt: "2026-08-15T03:00:00.000Z",
			updatedAt: now
		},
		{
			id: "tenant-health",
			code: "ABC-HEALTH",
			name: "ABC Health",
			status: "ACTIVE",
			description: "Khối chăm sóc sức khỏe minh họa",
			contactEmail: "privacy@abchealth.vn",
			createdAt: "2026-09-20T03:00:00.000Z",
			updatedAt: now
		}
	];
};
var safeTenant = (value) => {
	if (!value || typeof value !== "object") return false;
	const x = value;
	return typeof x.id === "string" && typeof x.code === "string" && typeof x.name === "string" && (x.status === "ACTIVE" || x.status === "SUSPENDED");
};
function readPlatformSnapshot() {
	if (typeof window === "undefined") return null;
	try {
		const raw = JSON.parse(window.localStorage.getItem("cmp-platform-state-v1") || "null");
		if (!raw || !Array.isArray(raw.tenants) || !raw.tenants.every(safeTenant) || !Array.isArray(raw.audit)) return null;
		const actorId = PLATFORM_ACTORS.some((a) => a.id === raw.actorId) ? raw.actorId : "tenant-only-admin";
		return {
			tenants: raw.tenants,
			audit: raw.audit,
			actorId
		};
	} catch {
		return null;
	}
}
var readPlatformTenants = () => readPlatformSnapshot()?.tenants || seedPlatformTenants();
function writePlatformSnapshot(snapshot) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(PLATFORM_STORAGE_KEY, JSON.stringify(snapshot));
}
//#endregion
//#region src/lib/application-data.ts
var APPLICATION_STORAGE_KEY = "cmp-tenant-applications-v1";
var APPLICATION_CODE_RE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;
var memorySnapshot = {};
var valid = (tenantId, value) => {
	if (!value || typeof value !== "object") return false;
	const a = value;
	return a.tenantId === tenantId && typeof a.id === "string" && !!a.id && typeof a.name === "string" && !!a.name && typeof a.code === "string" && APPLICATION_CODE_RE.test(a.code) && [
		"WEB",
		"SYSTEM",
		"MOBILE"
	].includes(String(a.type)) && (a.propertyId === void 0 || typeof a.propertyId === "string") && typeof a.property === "string" && ["ACTIVE", "INACTIVE"].includes(String(a.status)) && typeof a.createdAt === "string" && typeof a.updatedAt === "string" && typeof a.createdBy === "string";
};
function readApplicationSnapshot() {
	let raw = memorySnapshot;
	if (typeof window !== "undefined") try {
		raw = JSON.parse(window.localStorage.getItem("cmp-tenant-applications-v1") || "{}");
	} catch {
		raw = {};
	}
	if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
	return Object.fromEntries(Object.entries(raw).map(([tenantId, apps]) => [tenantId, Array.isArray(apps) ? apps.filter((a) => valid(tenantId, a)) : []]));
}
function persistTenantApplications(tenantId, applications) {
	const snapshot = {
		...readApplicationSnapshot(),
		[tenantId]: applications.map((a) => ({ ...a }))
	};
	memorySnapshot = snapshot;
	if (typeof window !== "undefined") window.localStorage.setItem(APPLICATION_STORAGE_KEY, JSON.stringify(snapshot));
}
function validateApplicationInput(input, applications, applicationId) {
	const value = {
		...input,
		name: input.name.trim(),
		code: input.code.trim().toUpperCase(),
		description: input.description?.trim() || ""
	};
	const errors = {};
	if (!value.name) errors.name = "Tên ứng dụng là bắt buộc.";
	else if (value.name.length > 100) errors.name = "Tên ứng dụng không được vượt quá 100 ký tự.";
	if (!value.code) errors.code = "Mã ứng dụng là bắt buộc.";
	else if (value.code.length > 50 || !APPLICATION_CODE_RE.test(value.code)) errors.code = "Dùng 1–50 ký tự in hoa, số và dấu gạch ngang; bắt đầu bằng chữ.";
	else if (applications.some((a) => a.id !== applicationId && a.code.toUpperCase() === value.code)) errors.code = "Mã ứng dụng đã tồn tại trong tenant này.";
	if (applications.some((a) => a.id !== applicationId && a.name.toLowerCase() === value.name.toLowerCase())) errors.name = "Tên ứng dụng đã tồn tại trong tenant này.";
	if (![
		"WEB",
		"SYSTEM",
		"MOBILE"
	].includes(value.type)) errors.type = "Loại ứng dụng không hợp lệ.";
	if ((value.description || "").length > 500) errors.description = "Mô tả không được vượt quá 500 ký tự.";
	return {
		value,
		errors
	};
}
//#endregion
//#region src/lib/store.ts
/**
* Store dữ liệu dùng chung của prototype (zustand).
* Mọi màn đọc, ghi cùng một nguồn để thao tác ở màn này hiện ra ở màn khác.
* Không có backend: dữ liệu nghiệp vụ reset khi tải lại trang; context demo hợp lệ được khôi phục.
*/
var clone = (x) => JSON.parse(JSON.stringify(x));
var DEMO_USERS = {
	"user-staff": {
		name: PERSONA["Nhân viên"],
		email: "staff@demo.cmp"
	},
	"user-dpo": {
		name: PERSONA.DPO,
		email: "dpo@demo.cmp"
	},
	"user-admin": {
		name: PERSONA.Admin,
		email: "admin@demo.cmp"
	},
	"user-health-admin": {
		name: "Đặng Hải An",
		email: "admin.health@demo.cmp"
	},
	"user-health-dpo": {
		name: "Vũ Minh Anh",
		email: "dpo.health@demo.cmp"
	}
};
var DEMO_MEMBERSHIPS = [
	{
		userId: "user-staff",
		tenantId: "tenant-retail",
		roles: ["Nhân viên"],
		status: "ACTIVE"
	},
	{
		userId: "user-dpo",
		tenantId: "tenant-retail",
		roles: ["DPO"],
		status: "ACTIVE"
	},
	{
		userId: "user-admin",
		tenantId: "tenant-retail",
		roles: ["Admin"],
		status: "ACTIVE"
	},
	{
		userId: "user-staff",
		tenantId: "tenant-finance",
		roles: ["Admin"],
		status: "ACTIVE"
	},
	{
		userId: "user-dpo",
		tenantId: "tenant-finance",
		roles: ["DPO"],
		status: "ACTIVE"
	},
	{
		userId: "user-admin",
		tenantId: "tenant-health",
		roles: ["Nhân viên"],
		status: "ACTIVE"
	},
	{
		userId: "user-health-admin",
		tenantId: "tenant-health",
		roles: ["Admin", "DPO"],
		status: "ACTIVE"
	},
	{
		userId: "user-health-dpo",
		tenantId: "tenant-health",
		roles: ["DPO"],
		status: "ACTIVE"
	}
];
var seedOutbox = () => [
	{
		id: "evt_77f2a1",
		type: "CONSENT_WITHDRAWN",
		consent: "CS-MKT-EMAIL",
		subject: SUBJECTS[7],
		dest: "Hệ thống gửi email (ESP)",
		status: "FAILED",
		at: "2026-10-26T08:10:00Z",
		tries: 6
	},
	{
		id: "evt_77f2a0",
		type: "CONSENT_WITHDRAWN",
		consent: "CS-MKT-EMAIL",
		subject: SUBJECTS[19],
		dest: "Hệ thống gửi email (ESP)",
		status: "FAILED",
		at: "2026-10-26T08:02:00Z",
		tries: 6
	},
	{
		id: "evt_77f19c",
		type: "CONSENT_ACCEPTED",
		consent: "CS-MKT-PERSONAL",
		subject: SUBJECTS[31],
		dest: "Nền tảng dữ liệu khách hàng (CDP)",
		status: "RETRY",
		at: "2026-10-28T01:30:00Z",
		tries: 2
	},
	{
		id: "evt_77f188",
		type: "VERSION_CHANGED",
		consent: "CS-MKT-PERSONAL",
		subject: SUBJECTS[2],
		dest: "CRM chăm sóc khách hàng",
		status: "DELIVERED",
		at: "2026-10-27T09:12:00Z",
		tries: 1
	}
];
function seedWorkspace(kind) {
	const tenantId = `tenant-${kind}`;
	const applications = clone(APPS);
	const names = kind === "retail" ? [
		"Website abcmart.vn",
		"Cổng thành viên member.abcmart.vn",
		"Ứng dụng ABC Mart (iOS/Android)"
	] : kind === "finance" ? [
		"ABC Finance Website",
		"Cổng khách hàng ABC Finance",
		"ABC Finance Mobile"
	] : [
		"ABC Health Website",
		"Cổng bệnh nhân ABC Health",
		"ABC Health Mobile"
	];
	const sites = kind === "retail" ? [
		"abcmart.vn",
		"member.abcmart.vn",
		"Ứng dụng ABC Mart"
	] : kind === "finance" ? [
		"abcfinance.vn",
		"portal.abcfinance.vn",
		"ABC Finance Mobile"
	] : [
		"abchealth.vn",
		"patient.abchealth.vn",
		"ABC Health Mobile"
	];
	const seededAt = "2026-03-15T03:00:00Z";
	const normalizedApplications = applications.map((a, i) => ({
		...a,
		tenantId,
		name: names[i],
		property: sites[i],
		propertyId: `property-${i + 1}`,
		code: kind === "retail" ? [
			"ABC-WEB",
			"ABC-MEMBER",
			"ABC-MOBILE"
		][i] : `${kind.toUpperCase()}-${[
			"WEB",
			"PORTAL",
			"MOBILE"
		][i]}`,
		type: i === 2 ? "MOBILE" : "WEB",
		status: "ACTIVE",
		createdAt: seededAt,
		updatedAt: seededAt,
		createdBy: "seed",
		activatedAt: seededAt
	}));
	const propertyMap = new Map(PROPERTIES.map((p, i) => [p, sites[i]]));
	const events = clone(EVENTS).slice(0, kind === "retail" ? void 0 : 36).map((e) => ({
		...e,
		property: propertyMap.get(e.property) || sites[0]
	}));
	const purposes = clone(PURPOSES);
	if (kind === "finance") purposes[0] = {
		...purposes[0],
		name: "Quản lý hồ sơ khách hàng tài chính"
	};
	if (kind === "health") purposes[0] = {
		...purposes[0],
		name: "Quản lý hồ sơ chăm sóc sức khỏe"
	};
	const banners = clone(BANNERS).map((b) => ({
		...b,
		site: propertyMap.get(b.site) || sites[0]
	}));
	return {
		perm: clone(PERM_DEFAULT),
		applications: normalizedApplications,
		properties: normalizedApplications.map((a, i) => ({
			id: `property-${i + 1}`,
			tenantId,
			name: a.property,
			code: `${kind.toUpperCase()}-${[
				"WEB",
				"PORTAL",
				"MOBILE"
			][i]}`,
			type: i === 2 ? "ANDROID" : "WEB",
			applicationId: a.id,
			origin: i < 2 ? `https://${sites[i]}` : void 0,
			packageName: i === 2 ? `vn.abc.${kind}` : void 0,
			status: "ACTIVE",
			createdAt: seededAt,
			updatedAt: seededAt,
			createdBy: "seed",
			activatedAt: seededAt
		})),
		purposes,
		consents: clone(CONSENTS),
		notices: clone(NOTICES),
		banners,
		events,
		audit: clone(AUDIT),
		nlog: clone(NLOG),
		alerts: clone(ALERTS),
		imports: clone(IMPORTS),
		packages: [],
		ruleSets: clone(RECONSENT_RULES),
		matrix: clone(MATRIX),
		users: clone(USERS),
		outbox: seedOutbox()
	};
}
var INITIAL_WORKSPACES = {
	"tenant-retail": seedWorkspace("retail"),
	"tenant-finance": seedWorkspace("finance"),
	"tenant-health": seedWorkspace("health")
};
var persistedApplications = readApplicationSnapshot();
for (const [tenantId, applications] of Object.entries(persistedApplications)) {
	const workspace = INITIAL_WORKSPACES[tenantId];
	if (workspace) workspace.applications = applications;
}
var persistedProperties = readPropertySnapshot();
for (const [tenantId, properties] of Object.entries(persistedProperties)) {
	const workspace = INITIAL_WORKSPACES[tenantId];
	if (workspace) workspace.properties = properties.filter((p) => workspace.applications.some((a) => a.id === p.applicationId));
}
var createEmptyTenantWorkspace = () => ({
	perm: clone(PERM_DEFAULT),
	applications: [],
	properties: [],
	purposes: [],
	consents: [],
	notices: [],
	banners: [],
	events: [],
	audit: [],
	nlog: [],
	alerts: [],
	imports: [],
	packages: [],
	ruleSets: [],
	matrix: [],
	users: [],
	outbox: []
});
var initialTenantRegistry = readPlatformTenants();
for (const tenant of initialTenantRegistry) if (!INITIAL_WORKSPACES[tenant.id]) INITIAL_WORKSPACES[tenant.id] = createEmptyTenantWorkspace();
var DEMO_CONTEXT_KEY = "cmp-demo-context-v1";
function resolveDemoContext(value) {
	const fallback = {
		tenantId: "tenant-retail",
		userId: "user-staff",
		role: "Nhân viên"
	};
	if (!value || typeof value !== "object") return fallback;
	const raw = value;
	const tenant = readPlatformTenants().find((t) => t.id === raw.tenantId && t.status === "ACTIVE");
	if (!tenant || typeof raw.userId !== "string") return fallback;
	const membership = DEMO_MEMBERSHIPS.find((m) => m.tenantId === tenant.id && m.userId === raw.userId && m.status === "ACTIVE");
	if (!membership) return fallback;
	const role = resolveEffectiveRole(membership, raw.role);
	return role ? {
		tenantId: tenant.id,
		userId: membership.userId,
		role
	} : fallback;
}
var loadDemoContext = () => {
	if (typeof window === "undefined") return resolveDemoContext(void 0);
	try {
		return resolveDemoContext(JSON.parse(window.localStorage.getItem(DEMO_CONTEXT_KEY) || "null"));
	} catch {
		return resolveDemoContext(void 0);
	}
};
var persistDemoContext = (context) => {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(DEMO_CONTEXT_KEY, JSON.stringify(context));
};
var workspaceFields = (s) => ({
	perm: clone(s.perm),
	applications: clone(s.applications),
	properties: clone(s.properties),
	purposes: clone(s.purposes),
	consents: clone(s.consents),
	notices: clone(s.notices),
	banners: clone(s.banners),
	events: clone(s.events),
	audit: clone(s.audit),
	nlog: clone(s.nlog),
	alerts: clone(s.alerts),
	imports: clone(s.imports),
	packages: clone(s.packages),
	ruleSets: clone(s.ruleSets),
	matrix: clone(s.matrix),
	users: clone(s.users),
	outbox: clone(s.outbox)
});
var currentMembership = (s) => s.memberships.find((m) => m.tenantId === s.currentTenantId && m.userId === s.currentUserId && m.status === "ACTIVE");
var currentActor = (s) => s.currentUserId ? DEMO_USERS[s.currentUserId]?.name || s.currentUserId : "Chưa chọn người dùng";
var hasPermission = (s, mod, act = "view") => {
	return canWithEffectiveRole(currentMembership(s), s.role, s.perm, mod, act);
};
var cfgArr = (s, kind) => kind === "purpose" ? s.purposes : s.consents;
var label = {
	purpose: "Mục đích",
	consent: "Consent"
};
var snap = (kind, o, applications = []) => {
	if (kind === "purpose") return snapPurpose(o);
	const c = o;
	return {
		...snapConsent(c),
		"Ứng dụng": c.apps.map((id) => applications.find((a) => a.id === id)?.name || id)
	};
};
var show = (v) => Array.isArray(v) ? v.join(", ") || "—" : v === void 0 || v === null || v === "" ? "—" : String(v);
var useStore = create((set, get) => {
	const me = () => currentActor(get());
	const upd = (fn) => set((s) => fn(s));
	const allowed = (mod, act, action, object) => {
		const s = get();
		if (hasPermission(s, mod, act)) return true;
		set({ audit: [{
			tenantId: s.currentTenantId || void 0,
			userId: s.currentUserId || void 0,
			at: nowISO(),
			who: me(),
			role: s.role,
			act: action,
			obj: object,
			res: "err",
			det: "403 – vai trò hiệu lực không có quyền trong tenant hiện tại"
		}, ...s.audit] });
		return false;
	};
	const notifyApprovers = (mod, text, link) => {
		const s = get();
		s.memberships.filter((m) => m.tenantId === s.currentTenantId && m.status === "ACTIVE" && m.roles.some((r) => canWithEffectiveRole(m, r, s.perm, mod, "approve"))).forEach((m) => {
			const name = DEMO_USERS[m.userId]?.name || m.userId;
			if (name !== me()) s.notify(name, text, link, "info");
		});
	};
	const initialContext = loadDemoContext();
	const initialWorkspace = clone(INITIAL_WORKSPACES[initialContext.tenantId]);
	return {
		tenants: clone(initialTenantRegistry),
		memberships: clone(DEMO_MEMBERSHIPS),
		currentTenantId: initialContext.tenantId,
		currentUserId: initialContext.userId,
		workspaces: clone(INITIAL_WORKSPACES),
		role: initialContext.role,
		...initialWorkspace,
		switchTenant: (tenantId) => {
			const s = get();
			if (tenantId === s.currentTenantId) return {
				ok: true,
				msg: "Tenant đã được chọn."
			};
			const tenant = s.tenants.find((t) => t.id === tenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			const membership = s.memberships.find((m) => m.tenantId === tenantId && m.userId === s.currentUserId && m.status === "ACTIVE");
			if (!membership) return {
				ok: false,
				msg: "Người dùng hiện tại không có membership hoạt động trong tenant này."
			};
			const target = s.workspaces[tenantId];
			if (!target) return {
				ok: false,
				msg: "Không tìm thấy workspace của tenant."
			};
			const nextWorkspaces = { ...s.workspaces };
			if (s.currentTenantId) nextWorkspaces[s.currentTenantId] = workspaceFields(s);
			const nextRole = resolveEffectiveRole(membership, s.role);
			if (!nextRole) return {
				ok: false,
				msg: "Membership không có vai trò hợp lệ trong tenant đích."
			};
			set({
				...clone(target),
				workspaces: nextWorkspaces,
				currentTenantId: tenantId,
				currentUserId: membership.userId,
				role: nextRole
			});
			persistDemoContext({
				tenantId,
				userId: membership.userId,
				role: nextRole
			});
			return {
				ok: true,
				msg: `Đã chuyển sang ${tenant.name}.`
			};
		},
		setPersona: (userId) => {
			const s = get();
			const membership = s.memberships.find((m) => m.tenantId === s.currentTenantId && m.userId === userId && m.status === "ACTIVE");
			if (!membership) return {
				ok: false,
				msg: "Persona không có membership hoạt động trong tenant hiện tại."
			};
			const nextRole = resolveEffectiveRole(membership, s.role);
			if (!nextRole) return {
				ok: false,
				msg: "Persona không có vai trò hợp lệ trong tenant hiện tại."
			};
			set({
				currentUserId: userId,
				role: nextRole
			});
			if (s.currentTenantId) persistDemoContext({
				tenantId: s.currentTenantId,
				userId,
				role: nextRole
			});
			return {
				ok: true,
				msg: `Đang mô phỏng ${DEMO_USERS[userId]?.name || userId}.`
			};
		},
		getCurrentTenant: () => get().tenants.find((t) => t.id === get().currentTenantId),
		getCurrentMembership: () => currentMembership(get()),
		getWorkspace: (tenantId) => tenantId === get().currentTenantId ? workspaceFields(get()) : get().workspaces[tenantId],
		setRole: (r) => {
			const s = get();
			const role = resolveEffectiveRole(currentMembership(s), r);
			if (role !== r) {
				s.log("Đổi vai trò hiệu lực", String(r), "err", "Vai trò không thuộc membership đang hoạt động trong tenant hiện tại");
				return {
					ok: false,
					msg: "Vai trò không được gán cho bạn trong tenant hiện tại."
				};
			}
			set({ role });
			if (s.currentTenantId && s.currentUserId) persistDemoContext({
				tenantId: s.currentTenantId,
				userId: s.currentUserId,
				role
			});
			return {
				ok: true,
				msg: `Vai trò hiệu lực: ${role}.`
			};
		},
		setPerm: (r, m, a, v) => {
			if (!allowed("users", "edit", "Sửa ma trận phân quyền", `Vai trò ${r} · ${m} · ${a}`)) return;
			const before = String(get().perm[r][m][a]);
			upd((s) => {
				const p = clone(s.perm);
				p[r][m][a] = v;
				return { perm: p };
			});
			get().log("Sửa ma trận phân quyền", `Vai trò ${r} · ${m} · ${a}`, "ok", void 0, before, String(v));
		},
		createApplication: (input, expectedTenantId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return {
				ok: false,
				msg: "Ngữ cảnh tenant đã thay đổi. Vui lòng mở lại biểu mẫu."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			if (!allowed("integ", "edit", "Đăng ký ứng dụng", input.code || input.name)) return {
				ok: false,
				msg: "Bạn không có quyền đăng ký ứng dụng trong tenant này."
			};
			const checked = validateApplicationInput(input, s.applications);
			if (Object.keys(checked.errors).length) return {
				ok: false,
				msg: "Vui lòng kiểm tra dữ liệu nhập.",
				errors: checked.errors
			};
			const now = nowISO();
			const actorId = s.currentUserId || "unknown";
			const application = {
				id: `app_${fakeHash(`${s.currentTenantId}|${checked.value.code}|${now}`).slice(0, 12)}`,
				tenantId: s.currentTenantId,
				...checked.value,
				propertyId: void 0,
				description: checked.value.description || void 0,
				property: "Chưa có Property",
				status: "INACTIVE",
				createdAt: now,
				updatedAt: now,
				createdBy: actorId
			};
			const applications = [application, ...s.applications];
			set({ applications });
			persistTenantApplications(s.currentTenantId, applications);
			get().log("Đăng ký ứng dụng", application.id, "ok", `code=${application.code}; status=INACTIVE`);
			return {
				ok: true,
				msg: `Đã đăng ký ứng dụng ${application.name}.`,
				applicationId: application.id
			};
		},
		updateApplication: (applicationId, input, expectedTenantId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return {
				ok: false,
				msg: "Ngữ cảnh tenant đã thay đổi. Thay đổi chưa được lưu."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			if (!allowed("integ", "edit", "Cập nhật ứng dụng", applicationId)) return {
				ok: false,
				msg: "Bạn không có quyền sửa ứng dụng trong tenant này."
			};
			const current = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId);
			if (!current) {
				get().log("Cập nhật ứng dụng", applicationId, "err", "Application không thuộc tenant hiện tại");
				return {
					ok: false,
					msg: "Không tìm thấy ứng dụng trong tenant hiện tại."
				};
			}
			const checked = validateApplicationInput(input, s.applications, applicationId);
			if (current.activatedAt && checked.value.type !== current.type) checked.errors.type = "Không thể đổi loại sau khi ứng dụng đã từng Active.";
			if (Object.keys(checked.errors).length) return {
				ok: false,
				msg: "Vui lòng kiểm tra dữ liệu nhập.",
				errors: checked.errors
			};
			const changedFields = [
				"name",
				"code",
				"type",
				"description"
			].filter((k) => (current[k] || "") !== (checked.value[k] || ""));
			if (!changedFields.length) return {
				ok: false,
				msg: "Không có thay đổi để lưu."
			};
			const updated = {
				...current,
				...checked.value,
				propertyId: current.propertyId,
				description: checked.value.description || void 0,
				property: current.property,
				updatedAt: nowISO(),
				updatedBy: s.currentUserId || "unknown"
			};
			const applications = s.applications.map((a) => a.id === applicationId ? updated : a);
			set({ applications });
			persistTenantApplications(s.currentTenantId, applications);
			get().log("Cập nhật ứng dụng", applicationId, "ok", `fields=${changedFields.join(",")}`);
			return {
				ok: true,
				msg: "Đã cập nhật ứng dụng."
			};
		},
		setApplicationStatus: (applicationId, status, expectedTenantId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return {
				ok: false,
				msg: "Ngữ cảnh tenant đã thay đổi. Thao tác bị hủy."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			if (!allowed("integ", "edit", status === "ACTIVE" ? "Kích hoạt ứng dụng" : "Ngừng ứng dụng", applicationId)) return {
				ok: false,
				msg: "Bạn không có quyền đổi trạng thái ứng dụng."
			};
			const current = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId);
			if (!current) {
				get().log("Đổi trạng thái ứng dụng", applicationId, "err", "Application không thuộc tenant hiện tại");
				return {
					ok: false,
					msg: "Không tìm thấy ứng dụng trong tenant hiện tại."
				};
			}
			if (current.status === status) return {
				ok: true,
				msg: "Ứng dụng đã ở trạng thái này."
			};
			const now = nowISO();
			const updated = {
				...current,
				status,
				updatedAt: now,
				updatedBy: s.currentUserId || "unknown",
				activatedAt: status === "ACTIVE" ? current.activatedAt || now : current.activatedAt
			};
			const applications = s.applications.map((a) => a.id === applicationId ? updated : a);
			set({ applications });
			persistTenantApplications(s.currentTenantId, applications);
			get().log(status === "ACTIVE" ? "Kích hoạt ứng dụng" : "Ngừng ứng dụng", applicationId, "ok", `status=${status}`);
			return {
				ok: true,
				msg: status === "ACTIVE" ? "Đã kích hoạt ứng dụng." : "Đã chuyển ứng dụng sang Inactive; dữ liệu và quan hệ được giữ nguyên."
			};
		},
		createProperty: (applicationId, input, expectedTenantId, expectedApplicationId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId || applicationId !== expectedApplicationId) return {
				ok: false,
				msg: "Ngữ cảnh tenant hoặc Application đã thay đổi. Vui lòng mở lại biểu mẫu."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			if (!allowed("integ", "edit", "Tạo Property", applicationId)) return {
				ok: false,
				msg: "Bạn không có quyền quản lý Property."
			};
			const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId);
			if (!application) return {
				ok: false,
				msg: "Application không thuộc tenant hiện tại."
			};
			if (application.status !== "ACTIVE") return {
				ok: false,
				msg: "Chỉ có thể tạo Property dưới Application đang Active."
			};
			const checked = validatePropertyInput(input, s.properties, applicationId);
			if (Object.keys(checked.errors).length) return {
				ok: false,
				msg: "Vui lòng kiểm tra dữ liệu Property.",
				errors: checked.errors
			};
			const now = nowISO();
			const actorId = s.currentUserId || "unknown";
			const property = {
				id: `property_${fakeHash(`${s.currentTenantId}|${applicationId}|${checked.value.code}|${now}`).slice(0, 12)}`,
				tenantId: s.currentTenantId,
				applicationId,
				name: checked.value.name,
				code: checked.value.code,
				type: checked.value.type,
				origin: checked.value.type === "WEB" ? checked.value.origin : void 0,
				packageName: checked.value.type === "ANDROID" ? checked.value.packageName : void 0,
				bundleId: checked.value.type === "IOS" ? checked.value.bundleId : void 0,
				description: checked.value.description || void 0,
				status: "ACTIVE",
				createdAt: now,
				updatedAt: now,
				createdBy: actorId,
				activatedAt: now
			};
			const properties = [property, ...s.properties];
			set({ properties });
			persistTenantProperties(s.currentTenantId, properties);
			get().log("Tạo Property", property.id, "ok", `applicationId=${applicationId}; propertyId=${property.id}; code=${property.code}`);
			return {
				ok: true,
				msg: `Đã tạo Property ${property.name}.`,
				propertyId: property.id
			};
		},
		updateProperty: (applicationId, propertyId, input, expectedTenantId, expectedApplicationId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId || applicationId !== expectedApplicationId) return {
				ok: false,
				msg: "Ngữ cảnh tenant hoặc Application đã thay đổi. Thay đổi chưa được lưu."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			if (!allowed("integ", "edit", "Cập nhật Property", propertyId)) return {
				ok: false,
				msg: "Bạn không có quyền quản lý Property."
			};
			const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId);
			const current = s.properties.find((p) => p.id === propertyId && p.tenantId === s.currentTenantId && p.applicationId === applicationId);
			if (!application || !current) return {
				ok: false,
				msg: "Property không thuộc Application và tenant hiện tại."
			};
			const checked = validatePropertyInput(input, s.properties, applicationId, propertyId);
			if (Object.keys(checked.errors).length) return {
				ok: false,
				msg: "Vui lòng kiểm tra dữ liệu Property.",
				errors: checked.errors
			};
			const fields = [
				"name",
				"code",
				"type",
				"origin",
				"packageName",
				"bundleId",
				"description"
			].filter((k) => (current[k] || "") !== (checked.value[k] || ""));
			if (!fields.length) return {
				ok: false,
				msg: "Không có thay đổi để lưu."
			};
			const updated = {
				...current,
				name: checked.value.name,
				code: checked.value.code,
				type: checked.value.type,
				origin: checked.value.type === "WEB" ? checked.value.origin : void 0,
				packageName: checked.value.type === "ANDROID" ? checked.value.packageName : void 0,
				bundleId: checked.value.type === "IOS" ? checked.value.bundleId : void 0,
				description: checked.value.description || void 0,
				updatedAt: nowISO(),
				updatedBy: s.currentUserId || "unknown"
			};
			const properties = s.properties.map((p) => p.id === propertyId ? updated : p);
			set({ properties });
			persistTenantProperties(s.currentTenantId, properties);
			get().log("Cập nhật Property", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; fields=${fields.join(",")}`);
			return {
				ok: true,
				msg: "Đã cập nhật Property."
			};
		},
		setPropertyStatus: (applicationId, propertyId, status, expectedTenantId, expectedApplicationId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId || applicationId !== expectedApplicationId) return {
				ok: false,
				msg: "Ngữ cảnh tenant hoặc Application đã thay đổi. Thao tác bị hủy."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			if (!allowed("integ", "edit", "Đổi trạng thái Property", propertyId)) return {
				ok: false,
				msg: "Bạn không có quyền quản lý Property."
			};
			const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId);
			const current = s.properties.find((p) => p.id === propertyId && p.tenantId === s.currentTenantId && p.applicationId === applicationId);
			if (!application || !current) return {
				ok: false,
				msg: "Property không thuộc Application và tenant hiện tại."
			};
			if (current.status === status) return {
				ok: true,
				msg: "Property đã ở trạng thái này."
			};
			const now = nowISO();
			const updated = {
				...current,
				status,
				updatedAt: now,
				updatedBy: s.currentUserId || "unknown",
				activatedAt: status === "ACTIVE" ? current.activatedAt || now : current.activatedAt
			};
			const properties = s.properties.map((p) => p.id === propertyId ? updated : p);
			set({ properties });
			persistTenantProperties(s.currentTenantId, properties);
			get().log(status === "ACTIVE" ? "Kích hoạt Property" : "Ngừng Property", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; status=${status}`);
			return {
				ok: true,
				msg: status === "ACTIVE" ? "Đã kích hoạt Property." : "Đã chuyển Property sang Inactive; dữ liệu và quan hệ được giữ nguyên."
			};
		},
		assignPropertyIntegration: (applicationId, propertyId, consentCode, bannerCode, expectedTenantId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return {
				ok: false,
				msg: "Ngữ cảnh tenant đã thay đổi. Vui lòng thao tác lại."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant không khả dụng hoặc đã bị tạm ngừng."
			};
			if (!allowed("integ", "edit", "Gán cấu hình consent", propertyId)) return {
				ok: false,
				msg: "Bạn không có quyền gán cấu hình cho Property."
			};
			const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId);
			const property = s.properties.find((p) => p.id === propertyId && p.applicationId === applicationId && p.tenantId === s.currentTenantId);
			const consent = s.consents.find((c) => c.code === consentCode && c.status === "Hoạt động");
			const banner = s.banners.find((b) => b.code === bannerCode && b.versions.some((v) => v.status === "Hoạt động"));
			if (!application || !property) return {
				ok: false,
				msg: "Property không thuộc Application và tenant hiện tại."
			};
			if (!consent) return {
				ok: false,
				msg: "Consent Configuration chưa được DPO phê duyệt hoặc không thuộc tenant."
			};
			if (!banner) return {
				ok: false,
				msg: "Banner chưa được DPO phê duyệt hoặc không thuộc tenant."
			};
			const integration = {
				consentCode,
				bannerCode,
				status: "DRAFT",
				version: property.integration?.version || 0,
				deploymentId: property.integration?.deploymentId
			};
			const properties = s.properties.map((p) => p.id === propertyId ? {
				...p,
				integration,
				updatedAt: nowISO(),
				updatedBy: s.currentUserId || "unknown"
			} : p);
			set({ properties });
			persistTenantProperties(s.currentTenantId, properties);
			get().log("Gán cấu hình consent", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; consentCode=${consentCode}; bannerCode=${bannerCode}`);
			return {
				ok: true,
				msg: "Đã gán Consent Configuration và Banner. Cần Publish để dùng trong Simulator."
			};
		},
		publishPropertyIntegration: (applicationId, propertyId, expectedTenantId) => {
			const s = get();
			if (!s.currentTenantId || s.currentTenantId !== expectedTenantId) return {
				ok: false,
				msg: "Ngữ cảnh tenant đã thay đổi. Vui lòng thao tác lại."
			};
			const tenant = s.tenants.find((t) => t.id === s.currentTenantId);
			const application = s.applications.find((a) => a.id === applicationId && a.tenantId === s.currentTenantId);
			const property = s.properties.find((p) => p.id === propertyId && p.applicationId === applicationId && p.tenantId === s.currentTenantId);
			if (!tenant || tenant.status !== "ACTIVE" || !application || application.status !== "ACTIVE" || !property || property.status !== "ACTIVE") return {
				ok: false,
				msg: "Tenant, Application và Property phải ở trạng thái Active."
			};
			if (!allowed("integ", "edit", "Publish cấu hình Property", propertyId)) return {
				ok: false,
				msg: "Bạn không có quyền Publish cấu hình."
			};
			if (!property.integration) return {
				ok: false,
				msg: "Hãy gán Consent Configuration và Banner trước khi Publish."
			};
			const consent = s.consents.find((c) => c.code === property.integration?.consentCode && c.status === "Hoạt động");
			const banner = s.banners.find((b) => b.code === property.integration?.bannerCode && b.versions.some((v) => v.status === "Hoạt động"));
			if (!consent || !banner) return {
				ok: false,
				msg: "Consent hoặc Banner không còn ở trạng thái được phê duyệt."
			};
			const at = nowISO();
			const deploymentId = property.integration.deploymentId || `dep_${fakeHash(`${s.currentTenantId}|${propertyId}`).slice(0, 16)}`;
			const integration = {
				...property.integration,
				status: "PUBLISHED",
				version: property.integration.version + 1,
				deploymentId,
				publishedAt: at,
				publishedBy: s.currentUserId || "unknown"
			};
			const properties = s.properties.map((p) => p.id === propertyId ? {
				...p,
				integration,
				updatedAt: at,
				updatedBy: s.currentUserId || "unknown"
			} : p);
			set({ properties });
			persistTenantProperties(s.currentTenantId, properties);
			get().log("Publish cấu hình Property", propertyId, "ok", `applicationId=${applicationId}; propertyId=${propertyId}; deploymentId=${deploymentId}; version=${integration.version}`);
			return {
				ok: true,
				msg: `Đã Publish cấu hình v${integration.version}.`
			};
		},
		log: (act, obj, res = "ok", det, before, after) => upd((s) => ({ audit: [{
			tenantId: s.currentTenantId || void 0,
			userId: s.currentUserId || void 0,
			at: nowISO(),
			who: me(),
			role: s.role,
			act,
			obj,
			res,
			det,
			before,
			after
		}, ...s.audit] })),
		notify: (to, text, link, tone = "info") => upd((s) => ({ nlog: [{
			id: uid("N"),
			to,
			at: nowISO(),
			text,
			link,
			read: false,
			tone
		}, ...s.nlog] })),
		markRead: (id) => upd((s) => ({ nlog: s.nlog.map((n) => n.id === id ? {
			...n,
			read: true
		} : n) })),
		resolveAlert: (id, note) => {
			upd((s) => ({ alerts: s.alerts.map((a) => a.id === id ? {
				...a,
				status: "Đã xử lý",
				note
			} : a) }));
			get().log("Xử lý cảnh báo", id, "ok", note);
		},
		saveConfig: (kind, obj, isNew) => {
			if (!allowed("setup", "edit", "Lưu cấu hình", obj.code)) return;
			const s = get();
			if (kind === "consent") {
				const c = obj;
				if (c.purposes.some((code) => !s.purposes.some((p) => p.code === code)) || c.apps.some((id) => !s.applications.some((a) => a.id === id))) {
					s.log("Lưu cấu hình", c.code, "err", "Quan hệ Purpose/Application không thuộc tenant hiện tại");
					return;
				}
			}
			const key = kind === "purpose" ? "purposes" : "consents";
			const arr = cfgArr(s, kind);
			const at = nowISO();
			if (isNew) {
				const o = {
					...obj,
					status: "Nháp",
					everActive: false,
					history: [{
						at,
						who: me(),
						act: "Lưu nháp"
					}],
					versions: [],
					updatedAt: at
				};
				set({ [key]: [o, ...arr] });
				s.log("Lưu nháp", `${label[kind]} ${obj.code}`);
				return;
			}
			const cur = arr.find((x) => x.code === obj.code);
			let next;
			if (cur.everActive && (cur.status === "Hoạt động" || cur.status === "Bị trả lại")) next = {
				...cur,
				revision: {
					...obj,
					history: void 0,
					versions: void 0,
					revision: void 0
				},
				history: [{
					at,
					who: me(),
					act: "Lưu bản sửa đổi"
				}, ...cur.history],
				updatedAt: at
			};
			else next = {
				...cur,
				...obj,
				status: cur.status === "Bị trả lại" ? "Bị trả lại" : "Nháp",
				history: [{
					at,
					who: me(),
					act: "Lưu nháp"
				}, ...cur.history],
				updatedAt: at
			};
			set({ [key]: arr.map((x) => x.code === obj.code ? next : x) });
			s.log("Lưu nháp", `${label[kind]} ${obj.code}`, "ok", void 0, JSON.stringify(snap(kind, cur, s.applications)), JSON.stringify(snap(kind, {
				...cur,
				...obj
			}, s.applications)));
		},
		submitConfig: (kind, code) => {
			if (!allowed("setup", "edit", "Gửi duyệt", code)) return;
			const s = get();
			const key = kind === "purpose" ? "purposes" : "consents";
			const at = nowISO();
			set({ [key]: cfgArr(s, kind).map((x) => x.code === code ? {
				...x,
				status: "Chờ duyệt",
				returnNote: void 0,
				req: {
					action: x.everActive ? "Sửa" : "Tạo mới",
					by: me(),
					byRole: s.role,
					at
				},
				history: [{
					at,
					who: me(),
					act: "Gửi duyệt"
				}, ...x.history],
				updatedAt: at
			} : x) });
			s.log("Gửi duyệt", `${label[kind]} ${code}`);
			notifyApprovers("setup", `${label[kind]} ${code} chờ bạn duyệt`, "/notifications");
		},
		requestStop: (kind, code, reason) => {
			if (!allowed("setup", "edit", "Đề nghị ngừng", code)) return;
			const s = get();
			const key = kind === "purpose" ? "purposes" : "consents";
			const at = nowISO();
			set({ [key]: cfgArr(s, kind).map((x) => x.code === code ? {
				...x,
				status: "Chờ duyệt ngừng",
				req: {
					action: "Ngừng sử dụng",
					by: me(),
					byRole: s.role,
					at,
					reason
				},
				history: [{
					at,
					who: me(),
					act: "Đề nghị ngừng sử dụng",
					note: reason
				}, ...x.history]
			} : x) });
			s.log("Đề nghị ngừng", `${label[kind]} ${code}`, "ok", reason);
			notifyApprovers("setup", `Đề nghị ngừng ${label[kind].toLowerCase()} ${code}`, "/notifications");
		},
		deleteConfig: (kind, code) => {
			if (!allowed("setup", "edit", "Xóa cấu hình", code)) return;
			const s = get();
			set({ [kind === "purpose" ? "purposes" : "consents"]: cfgArr(s, kind).filter((x) => x.code !== code) });
			s.log("Xóa", `${label[kind]} ${code}`);
		},
		createNotice: (consent) => {
			if (!allowed("setup", "edit", "Tạo phiên bản thông báo", consent)) return "";
			const s = get();
			const pub = s.notices.find((n) => n.consent === consent && n.status === "Published");
			const c = s.consents.find((x) => x.code === consent);
			const last = s.notices.filter((n) => n.consent === consent).map((n) => n.v).sort().slice(-1)[0];
			const v = last ? (() => {
				const [a, b] = last.slice(1).split(".").map(Number);
				return `v${a}.${b + 1}`;
			})() : "v1.0";
			const id = `${consent}|${v}`;
			const tenantName = s.tenants.find((t) => t.id === s.currentTenantId)?.name || "Tenant";
			const n = {
				id,
				consent,
				v,
				sum: "",
				content: pub ? clone(pub.content) : JSON.parse(JSON.stringify({
					vi: buildContent(c, "vi"),
					en: buildContent(c, "en")
				}).replaceAll("ABC Retail", tenantName)),
				status: "Nháp",
				by: me(),
				at: nowISO()
			};
			upd((st) => ({ notices: [n, ...st.notices] }));
			s.log("Tạo phiên bản", `Phiên bản thông báo ${consent} ${v}`, "ok", pub ? `Sao chép từ ${pub.v}` : "Tạo mới");
			return id;
		},
		saveNotice: (id, patch) => {
			if (!allowed("setup", "edit", "Lưu thông báo", id)) return;
			upd((s) => ({ notices: s.notices.map((n) => n.id === id ? {
				...n,
				...patch,
				at: nowISO()
			} : n) }));
			get().log("Lưu nháp", `Phiên bản thông báo ${id.replace("|", " ")}`);
		},
		submitNotice: (id, suggested) => {
			if (!allowed("setup", "edit", "Gửi duyệt thông báo", id)) return;
			const s = get();
			upd((st) => ({ notices: st.notices.map((n) => n.id === id ? {
				...n,
				status: "Chờ duyệt",
				suggested,
				everSent: true,
				retNote: void 0,
				req: {
					action: "Xuất bản",
					by: me(),
					byRole: st.role,
					at: nowISO()
				}
			} : n) }));
			s.log("Gửi duyệt", `Phiên bản thông báo ${id.replace("|", " ")}`);
			notifyApprovers("setup", `Phiên bản ${id.replace("|", " ")} chờ duyệt xuất bản`, "/notifications");
		},
		cancelSchedule: (id) => {
			if (!allowed("setup", "edit", "Hủy lịch xuất bản", id)) return;
			upd((s) => ({ notices: s.notices.map((n) => n.id === id ? {
				...n,
				status: "Nháp",
				effectiveAt: void 0
			} : n) }));
			get().log("Hủy lịch xuất bản", `Phiên bản thông báo ${id.replace("|", " ")}`);
		},
		activateScheduled: (id) => {
			if (allowed("setup", "approve", "Kích hoạt lịch xuất bản", id)) publishNotice(id, true);
		},
		deleteNotice: (id) => {
			if (!allowed("setup", "edit", "Xóa phiên bản thông báo", id)) return;
			upd((s) => ({ notices: s.notices.filter((n) => n.id !== id) }));
			get().log("Xóa", `Phiên bản thông báo ${id.replace("|", " ")}`);
		},
		createBanner: (kind, name, site) => {
			if (!allowed("banner", "edit", "Tạo banner", name)) return "";
			const s = get();
			if (!s.properties.some((p) => p.name === site)) {
				s.log("Tạo banner", name, "err", "Property không thuộc tenant hiện tại");
				return "";
			}
			const pre = kind === "cookie" ? "CK" : "BN";
			const n = s.banners.filter((b) => b.kind === kind).length + 1;
			const code = `${pre}-${String(n).padStart(3, "0")}`;
			const base = clone(BANNERS.find((b) => b.kind === kind).versions[0].cfg);
			base.consents = [];
			upd((st) => ({ banners: [{
				code,
				name,
				kind,
				site,
				versions: [{
					v: 1,
					status: "Nháp",
					at: nowISO(),
					by: me(),
					note: "Tạo mới",
					cfg: base
				}]
			}, ...st.banners] }));
			s.log("Tạo banner", code);
			return code;
		},
		newBannerVersion: (code) => {
			if (!allowed("banner", "edit", "Tạo phiên bản banner", code)) return;
			upd((s) => ({ banners: s.banners.map((b) => {
				if (b.code !== code) return b;
				const base = b.versions.find((v) => v.status === "Hoạt động") || b.versions[0];
				return {
					...b,
					versions: [{
						v: b.versions[0].v + 1,
						status: "Nháp",
						at: nowISO(),
						by: me(),
						note: "",
						cfg: clone(base.cfg)
					}, ...b.versions]
				};
			}) }));
			get().log("Tạo phiên bản banner", code);
		},
		saveBannerCfg: (code, cfg, note) => {
			if (!allowed("banner", "edit", "Lưu banner", code)) return;
			upd((s) => ({ banners: s.banners.map((b) => b.code !== code ? b : {
				...b,
				versions: b.versions.map((v, i) => i === 0 ? {
					...v,
					cfg: clone(cfg),
					note,
					at: nowISO(),
					status: v.status === "Bị trả lại" ? "Nháp" : v.status
				} : v)
			}) }));
			get().log("Lưu nháp", `Banner ${code}`);
		},
		submitBanner: (code) => {
			if (!allowed("banner", "edit", "Gửi duyệt banner", code)) return;
			const s = get();
			upd((st) => ({ banners: st.banners.map((b) => b.code !== code ? b : {
				...b,
				versions: b.versions.map((v, i) => i === 0 ? {
					...v,
					status: "Chờ duyệt",
					retNote: void 0,
					req: {
						action: "Xuất bản",
						by: me(),
						byRole: st.role,
						at: nowISO()
					}
				} : v)
			}) }));
			s.log("Gửi duyệt", `Banner ${code}`);
			notifyApprovers("banner", `Banner ${code} chờ bạn duyệt`, "/notifications");
		},
		createImport: (file) => {
			if (!allowed("import", "edit", "Tải lô import", file)) return "";
			const id = uid("LOT");
			const s = get();
			const riskRows = [
				5,
				19,
				33
			].map((row, i) => ({
				row,
				subject: SUBJECTS[120 + i],
				consent: "CS-MKT-EMAIL",
				date: `2025-1${i}-02`,
				issue: "Thiếu tệp bằng chứng gốc"
			}));
			upd((st) => ({ imports: [{
				id,
				file,
				at: nowISO(),
				by: me(),
				rows: 128,
				ok: 122,
				err: 3,
				risk: 3,
				status: "Nháp",
				riskRows,
				errRows: [
					{
						row: 7,
						issue: "Mã khách hàng rỗng"
					},
					{
						row: 40,
						issue: "consent_code không tồn tại"
					},
					{
						row: 88,
						issue: "Ngày đồng ý ở tương lai"
					}
				]
			}, ...st.imports] }));
			s.log("Tải lô import", file);
			return id;
		},
		setRiskDecision: (id, row, d) => {
			if (allowed("import", "edit", "Đánh giá import", id)) upd((s) => ({ imports: s.imports.map((b) => b.id !== id ? b : {
				...b,
				riskRows: b.riskRows.map((r) => r.row === row ? {
					...r,
					decision: d
				} : r)
			}) }));
		},
		submitImport: (id) => {
			if (!allowed("import", "edit", "Gửi duyệt import", id)) return;
			const s = get();
			upd((st) => ({ imports: st.imports.map((b) => b.id === id ? {
				...b,
				status: "Chờ duyệt",
				req: {
					action: "Ghi lô",
					by: me(),
					byRole: st.role,
					at: nowISO()
				}
			} : b) }));
			s.log("Gửi duyệt", `Lô import ${id}`);
			notifyApprovers("import", `Lô import ${id} chờ xác nhận ghi`, "/notifications");
		},
		approve: (id, note, extra) => {
			const s = get();
			const item = getApprovals(s).find((x) => x.id === id);
			if (!item) return {
				ok: false,
				msg: "Đề nghị không còn chờ duyệt."
			};
			if (!hasPermission(s, item.mod, "approve")) {
				s.log("Phê duyệt", item.name, "err", "403 – không có quyền Phê duyệt trong tenant hiện tại");
				return {
					ok: false,
					msg: "Membership hiện tại chưa có quyền Phê duyệt nhóm này."
				};
			}
			if (item.by === me()) {
				s.log("Phê duyệt", item.name, "err", "BR-AP-01 – người gửi tự duyệt");
				return {
					ok: false,
					msg: "Bạn không thể phê duyệt đề nghị do chính mình gửi. (MSG-C-05)"
				};
			}
			const at = nowISO();
			if (item.kind === "purpose" || item.kind === "consent") set({ [item.kind === "purpose" ? "purposes" : "consents"]: cfgArr(s, item.kind).map((x) => {
				if (x.code !== item.ref) return x;
				const stop = x.status === "Chờ duyệt ngừng";
				const nv = {
					...!stop && x.revision ? {
						...x,
						...x.revision
					} : x,
					status: stop ? "Ngừng sử dụng" : "Hoạt động",
					everActive: true,
					req: void 0,
					revision: void 0,
					returnNote: void 0,
					history: [{
						at,
						who: me(),
						act: stop ? "Phê duyệt ngừng" : "Phê duyệt",
						note
					}, ...x.history],
					updatedAt: at
				};
				if (!stop) nv.versions = [{
					v: (x.versions[0]?.v || 0) + 1,
					at,
					by: me(),
					snap: snap(item.kind, nv, s.applications)
				}, ...x.versions];
				return nv;
			}) });
			else if (item.kind === "notice") {
				const eff = extra?.effective;
				upd((st) => ({ notices: st.notices.map((n) => n.id === item.ref ? {
					...n,
					material: extra?.material || n.suggested,
					materialReason: extra?.materialReason,
					approvedBy: me(),
					req: void 0,
					hash: fakeHash(JSON.stringify(n.content) + n.v),
					status: eff ? "Đã duyệt – chờ hiệu lực" : n.status,
					effectiveAt: eff || n.effectiveAt
				} : n) }));
				if (!eff) publishNotice(item.ref, false);
			} else if (item.kind === "banner") upd((st) => ({ banners: st.banners.map((b) => b.code !== item.ref ? b : {
				...b,
				versions: b.versions.map((v, i) => i === 0 ? {
					...v,
					status: "Hoạt động",
					ap: me(),
					req: void 0
				} : v.status === "Hoạt động" ? {
					...v,
					status: "Thay thế"
				} : v)
			}) }));
			else if (item.kind === "rule") {
				const version = Number(item.ref);
				upd((st) => ({ ruleSets: st.ruleSets.map((v) => v.version === version ? {
					...v,
					status: "Hoạt động",
					approvedBy: me(),
					approvedAt: at,
					req: void 0,
					returnNote: void 0,
					history: [{
						at,
						who: me(),
						act: "Phê duyệt",
						note
					}, ...v.history]
				} : v.status === "Hoạt động" ? {
					...v,
					status: "Thay thế"
				} : v) }));
			} else if (item.kind === "matrix") {
				const [app, rawVersion] = item.ref.split("|");
				const version = Number(rawVersion);
				upd((st) => ({ matrix: st.matrix.map((m) => m.app === app && m.version === version ? {
					...m,
					status: "Hoạt động",
					approvedBy: me(),
					approvedAt: at,
					req: void 0,
					returnNote: void 0,
					history: [{
						at,
						who: me(),
						act: "Phê duyệt",
						note
					}, ...m.history]
				} : m.app === app && m.status === "Hoạt động" ? {
					...m,
					status: "Thay thế"
				} : m) }));
			} else if (item.kind === "import") {
				const b = s.imports.find((x) => x.id === item.ref);
				if (b.riskRows.some((r) => !r.decision)) return {
					ok: false,
					msg: "BR-UC09-04: còn dòng rủi ro chưa có quyết định Giữ hoặc Xin lại."
				};
				const newEv = b.riskRows.filter((r) => r.decision === "Giữ").map((r, i) => ({
					id: uid("EV"),
					subject: r.subject,
					consent: r.consent,
					version: "Legacy",
					decision: "ACCEPTED",
					ts: `${r.date}T03:00:00Z`,
					channel: "Import",
					app: "—",
					property: s.properties[1]?.name || s.properties[0]?.name || "—",
					source: "Legacy",
					hash: fakeHash(r.subject + i),
					tx: "tx_" + fakeHash(r.subject).slice(0, 12),
					ip: "—",
					ua: "Import lô " + b.id,
					legacyBatch: b.id,
					legacyRisk: true
				}));
				upd((st) => ({
					imports: st.imports.map((x) => x.id === b.id ? {
						...x,
						status: "Đã ghi",
						req: void 0
					} : x),
					events: [...newEv, ...st.events]
				}));
			}
			s.log(item.kind === "notice" ? "Phê duyệt, xuất bản" : "Phê duyệt", item.name, "ok", note, "Chờ duyệt", item.kind === "matrix" ? "Hiện hành" : item.kind === "rule" ? "Hoạt động" : "Đã duyệt");
			s.notify(item.by, `${item.type} ${item.name} đã được duyệt bởi ${me()}`, item.link, "ok");
			return {
				ok: true,
				msg: `Đã phê duyệt ${item.type.toLowerCase()} ${item.name}.`
			};
		},
		reject: (id, note) => {
			const s = get();
			const item = getApprovals(s).find((x) => x.id === id);
			if (!item) return {
				ok: false,
				msg: "Đề nghị không còn chờ duyệt."
			};
			if (!note || note.trim().length < 10) return {
				ok: false,
				msg: "Vui lòng nhập lý do trả lại (tối thiểu 10 ký tự). (MSG-C-09)"
			};
			if (!hasPermission(s, item.mod, "approve") || item.by === me()) return {
				ok: false,
				msg: "Không đủ điều kiện trả lại (BR-AP-01)."
			};
			const at = nowISO();
			if (item.kind === "purpose" || item.kind === "consent") set({ [item.kind === "purpose" ? "purposes" : "consents"]: cfgArr(s, item.kind).map((x) => x.code !== item.ref ? x : {
				...x,
				status: x.status === "Chờ duyệt ngừng" ? "Hoạt động" : x.everActive ? "Hoạt động" : "Bị trả lại",
				returnNote: note,
				req: void 0,
				history: [{
					at,
					who: me(),
					act: "Trả lại",
					note
				}, ...x.history]
			}) });
			else if (item.kind === "notice") upd((st) => ({ notices: st.notices.map((n) => n.id === item.ref ? {
				...n,
				status: "Bị trả lại",
				retNote: note,
				req: void 0
			} : n) }));
			else if (item.kind === "banner") upd((st) => ({ banners: st.banners.map((b) => b.code !== item.ref ? b : {
				...b,
				versions: b.versions.map((v, i) => i === 0 ? {
					...v,
					status: "Bị trả lại",
					retNote: note,
					ap: me(),
					req: void 0
				} : v)
			}) }));
			else if (item.kind === "rule") {
				const version = Number(item.ref);
				upd((st) => ({ ruleSets: st.ruleSets.map((v) => v.version === version ? {
					...v,
					status: "Bị trả lại",
					req: void 0,
					returnNote: note,
					history: [{
						at,
						who: me(),
						act: "Trả lại",
						note
					}, ...v.history]
				} : v) }));
			} else if (item.kind === "matrix") {
				const [app, rawVersion] = item.ref.split("|");
				const version = Number(rawVersion);
				upd((st) => ({ matrix: st.matrix.map((m) => m.app === app && m.version === version ? {
					...m,
					status: "Bị trả lại",
					req: void 0,
					returnNote: note,
					history: [{
						at,
						who: me(),
						act: "Trả lại",
						note
					}, ...m.history]
				} : m) }));
			} else if (item.kind === "import") upd((st) => ({ imports: st.imports.map((x) => x.id === item.ref ? {
				...x,
				status: "Bị trả lại",
				retNote: note,
				req: void 0
			} : x) }));
			s.log("Trả lại", item.name, "ok", note, "Chờ duyệt", "Bị trả lại");
			s.notify(item.by, `${item.type} ${item.name} bị trả lại: ${note}`, item.link, "err");
			return {
				ok: true,
				msg: `Đã trả lại ${item.type.toLowerCase()} ${item.name} cho người gửi.`
			};
		},
		withdraw: (id) => {
			const s = get();
			const item = getApprovals(s).find((x) => x.id === id);
			if (!item || item.by !== me()) return;
			if (item.kind === "purpose" || item.kind === "consent") set({ [item.kind === "purpose" ? "purposes" : "consents"]: cfgArr(s, item.kind).map((x) => x.code !== item.ref ? x : {
				...x,
				status: x.everActive ? "Hoạt động" : "Nháp",
				req: void 0,
				history: [{
					at: nowISO(),
					who: me(),
					act: "Rút lại yêu cầu duyệt"
				}, ...x.history]
			}) });
			else if (item.kind === "notice") upd((st) => ({ notices: st.notices.map((n) => n.id === item.ref ? {
				...n,
				status: "Nháp",
				req: void 0
			} : n) }));
			else if (item.kind === "banner") upd((st) => ({ banners: st.banners.map((b) => b.code !== item.ref ? b : {
				...b,
				versions: b.versions.map((v, i) => i === 0 ? {
					...v,
					status: "Nháp",
					req: void 0
				} : v)
			}) }));
			else if (item.kind === "rule") upd((st) => ({ ruleSets: st.ruleSets.map((v) => v.version === Number(item.ref) ? {
				...v,
				status: "Nháp",
				req: void 0,
				history: [{
					at: nowISO(),
					who: me(),
					act: "Rút lại yêu cầu duyệt"
				}, ...v.history]
			} : v) }));
			else if (item.kind === "matrix") {
				const [app, rawVersion] = item.ref.split("|");
				upd((st) => ({ matrix: st.matrix.map((m) => m.app === app && m.version === Number(rawVersion) ? {
					...m,
					status: "Nháp",
					req: void 0,
					history: [{
						at: nowISO(),
						who: me(),
						act: "Rút lại yêu cầu duyệt"
					}, ...m.history]
				} : m) }));
			} else if (item.kind === "import") upd((st) => ({ imports: st.imports.map((x) => x.id === item.ref ? {
				...x,
				status: "Nháp",
				req: void 0
			} : x) }));
			s.log("Rút lại yêu cầu duyệt", item.name, "ok", void 0, "Chờ duyệt", "Nháp");
		},
		recordDecision: (o) => {
			const s = get();
			if (!allowed("sim", "view", "Ghi quyết định mô phỏng", o.consent)) throw new Error("Không có quyền sử dụng Simulator trong tenant hiện tại.");
			if (!s.consents.some((c) => c.code === o.consent) || o.app !== "—" && !s.applications.some((a) => a.id === o.app)) {
				s.log("Ghi quyết định mô phỏng", o.consent, "err", "Consent/Application không thuộc tenant hiện tại");
				throw new Error("Consent hoặc Application không thuộc tenant hiện tại.");
			}
			const pub = s.notices.find((n) => n.consent === o.consent && n.status === "Published");
			const app = s.applications.find((a) => a.id === o.app);
			const property = o.propertyId ? s.properties.find((p) => p.id === o.propertyId && p.applicationId === o.app && p.tenantId === s.currentTenantId) : void 0;
			if (o.propertyId && !property) throw new Error("Property không thuộc Application và tenant hiện tại.");
			const id = uid("EV");
			const e = {
				id,
				subject: o.subject,
				consent: o.consent,
				version: pub?.v || "—",
				decision: o.decision,
				ts: nowISO(),
				channel: o.channel,
				app: o.app,
				property: property?.name || app?.property || "abcmart.vn",
				source: o.source || "Trực tuyến",
				hash: pub?.hash || fakeHash(o.consent),
				tx: "tx_" + fakeHash(id).slice(0, 12),
				ip: "113.161.24.87",
				ua: "Chrome 130 · Windows 11 (mô phỏng)",
				sensitive: o.sensitive,
				explicitConfirm: o.explicitConfirm,
				linkedFrom: o.linkedFrom,
				receipt: (o.decision === "ACCEPTED" || o.decision === "REJECTED") && !o.subject.startsWith("ck_") ? {
					jti: "rcp_" + fakeHash(id).slice(0, 16),
					kid: "cmp-2026-07",
					alg: "ES256",
					enc: "RSA-OAEP-256 / A256GCM",
					aud: o.app,
					exp: "[N] giây (OI-04)",
					decision: o.decision
				} : void 0
			};
			const evType = {
				ACCEPTED: "CONSENT_ACCEPTED",
				REJECTED: "CONSENT_REJECTED",
				WITHDRAWN: "CONSENT_WITHDRAWN",
				EXPIRED: "CONSENT_EXPIRED",
				RE_CONSENT: "VERSION_CHANGED",
				NOT_CONSENTED: "—"
			}[o.decision];
			const out = ["CRM chăm sóc khách hàng", "Nền tảng dữ liệu khách hàng (CDP)"].map((dest, i) => ({
				id: "evt_" + fakeHash(id + i).slice(0, 6),
				type: evType,
				consent: o.consent,
				subject: o.subject,
				dest,
				status: "DELIVERED",
				at: e.ts,
				tries: 1
			}));
			upd((st) => ({
				events: [e, ...st.events],
				outbox: [...out, ...st.outbox]
			}));
			get().log(o.decision === "WITHDRAWN" ? "Rút lại consent trong Simulator" : "Ghi quyết định Simulator", e.id, "ok", `applicationId=${o.app}; propertyId=${property?.id || "legacy"}; consentCode=${o.consent}; decision=${o.decision}`);
			return e;
		},
		addOffline: (e) => {
			if (!allowed("offline", "edit", "Ghi nhận consent ngoại tuyến", e.consent)) return;
			if (!get().consents.some((c) => c.code === e.consent)) {
				get().log("Ghi nhận consent ngoại tuyến", e.consent, "err", "Consent không thuộc tenant hiện tại");
				return;
			}
			upd((s) => ({ events: [e, ...s.events] }));
			get().log("Ghi nhận consent ngoại tuyến", `${e.offline?.id} · ${e.subject} · ${e.consent}`);
		},
		correctEvent: (id, reason, consent, decision) => {
			if (!allowed("offline", "edit", "Hiệu chỉnh evidence", id)) return;
			const s = get();
			const orig = s.events.find((x) => x.id === id);
			if (!orig || !s.consents.some((c) => c.code === consent)) {
				s.log("Hiệu chỉnh evidence", id, "err", "Evidence/Consent không thuộc tenant hiện tại");
				return;
			}
			const e = {
				...orig,
				id: uid("EV"),
				ts: nowISO(),
				consent,
				decision,
				correctionOf: id,
				correctionReason: reason,
				receipt: void 0,
				offline: orig.offline ? {
					...orig.offline,
					id: orig.offline.id + "-HC"
				} : void 0
			};
			upd((st) => ({ events: [e, ...st.events] }));
			s.log("Hiệu chỉnh evidence", `${id} → ${e.id}`, "ok", reason);
			const dpo = s.memberships.find((m) => m.tenantId === s.currentTenantId && m.status === "ACTIVE" && m.roles.includes("DPO"));
			if (dpo) s.notify(DEMO_USERS[dpo.userId]?.name || dpo.userId, `Có evidence hiệu chỉnh ${e.id} cho ${orig.offline?.id || id}: ${reason}`, "/evidence", "info");
		},
		exportPackage: (p) => {
			if (!allowed("evidence", "edit", "Xuất gói bằng chứng", p.scope)) throw new Error("Không có quyền xuất gói bằng chứng.");
			const s = get();
			if (p.events.some((id) => !s.events.some((e) => e.id === id))) throw new Error("Evidence không thuộc tenant hiện tại.");
			const pkg = {
				...p,
				id: "EP-" + (/* @__PURE__ */ new Date()).getFullYear() + "-" + String(s.packages.length + 37).padStart(5, "0"),
				at: nowISO(),
				by: me(),
				pdfHash: fakeHash("pdf" + p.events.join()),
				jsonHash: fakeHash("json" + p.events.join())
			};
			upd((st) => ({ packages: [pkg, ...st.packages] }));
			s.log("Xuất gói bằng chứng", pkg.id, "ok", `${p.reason} · ${p.events.length} evidence · SHA-256 PDF ${pkg.pdfHash.slice(0, 12)}…`);
			return pkg;
		},
		createRuleDraft: () => {
			if (!allowed("setup", "edit", "Tạo bộ quy tắc", "Re-consent Rules")) return {
				ok: false,
				msg: "Không có quyền chỉnh sửa trong tenant hiện tại."
			};
			const s = get();
			const existing = s.ruleSets.find((x) => x.status === "Nháp" || x.status === "Chờ duyệt" || x.status === "Bị trả lại");
			if (existing) return {
				ok: false,
				msg: `Đã có bộ quy tắc R${existing.version} ở trạng thái ${existing.status}.`
			};
			const active = s.ruleSets.find((x) => x.status === "Hoạt động");
			if (!active) return {
				ok: false,
				msg: "Không tìm thấy bộ quy tắc đang Hoạt động."
			};
			const draft = {
				...clone(active),
				version: active.version + 1,
				status: "Nháp",
				at: nowISO(),
				by: me(),
				approvedBy: void 0,
				approvedAt: void 0,
				req: void 0,
				returnNote: void 0,
				history: [{
					at: nowISO(),
					who: me(),
					act: "Tạo bản nháp",
					note: `Sao chép từ R${active.version}`
				}]
			};
			upd((st) => ({ ruleSets: [
				active,
				draft,
				...st.ruleSets.filter((x) => x !== active)
			] }));
			s.log("Tạo bản nháp", `Bộ quy tắc tái đồng ý R${draft.version}`, "ok", `Sao chép từ R${active.version}`);
			return {
				ok: true,
				msg: `Đã tạo bản nháp R${draft.version}.`
			};
		},
		saveRuleDraft: (version, rows, defaultMonths) => {
			if (!allowed("setup", "edit", "Lưu bộ quy tắc", `R${version}`)) return {
				ok: false,
				msg: "Không có quyền chỉnh sửa trong tenant hiện tại."
			};
			const s = get();
			const v = s.ruleSets.find((x) => x.version === version);
			if (!v || !["Nháp", "Bị trả lại"].includes(v.status)) return {
				ok: false,
				msg: "Phiên bản không còn cho phép chỉnh sửa."
			};
			if (!Number.isInteger(defaultMonths) || defaultMonths < 1 || defaultMonths > 120) return {
				ok: false,
				msg: "Thời hạn đồng ý mặc định phải từ 1 đến 120 tháng. (MSG-04-03)"
			};
			if (rows.some((r) => r.locked && !r.material)) return {
				ok: false,
				msg: "Các thay đổi tối thiểu và dữ liệu nhạy cảm phải luôn là Trọng yếu."
			};
			upd((st) => ({ ruleSets: st.ruleSets.map((x) => x.version !== version ? x : {
				...x,
				rows: clone(rows),
				defaultMonths,
				status: "Nháp",
				returnNote: x.returnNote,
				at: nowISO(),
				history: [{
					at: nowISO(),
					who: me(),
					act: "Lưu nháp"
				}, ...x.history]
			}) }));
			s.log("Lưu nháp", `Bộ quy tắc tái đồng ý R${version}`, "ok", void 0, void 0, `${defaultMonths} tháng`);
			return {
				ok: true,
				msg: `Đã lưu bản nháp R${version}.`
			};
		},
		submitRule: (version) => {
			if (!allowed("setup", "edit", "Gửi duyệt bộ quy tắc", `R${version}`)) return {
				ok: false,
				msg: "Không có quyền chỉnh sửa trong tenant hiện tại."
			};
			const s = get();
			const v = s.ruleSets.find((x) => x.version === version);
			if (!v || !["Nháp", "Bị trả lại"].includes(v.status)) return {
				ok: false,
				msg: "Chỉ bản Nháp hoặc Bị trả lại mới được gửi duyệt."
			};
			if (!Number.isInteger(v.defaultMonths) || v.defaultMonths < 1 || v.defaultMonths > 120) return {
				ok: false,
				msg: "Thời hạn đồng ý mặc định phải từ 1 đến 120 tháng. (MSG-04-03)"
			};
			const at = nowISO();
			const req = {
				action: "Cập nhật quy tắc",
				by: me(),
				byRole: s.role,
				at
			};
			upd((st) => ({ ruleSets: st.ruleSets.map((x) => x.version !== version ? x : {
				...x,
				status: "Chờ duyệt",
				req,
				returnNote: void 0,
				history: [{
					at,
					who: me(),
					act: "Gửi duyệt"
				}, ...x.history]
			}) }));
			s.log("Gửi duyệt", `Bộ quy tắc tái đồng ý R${version}`, "ok", void 0, "Nháp", "Chờ duyệt");
			notifyApprovers("setup", `Bộ quy tắc tái đồng ý R${version} chờ bạn duyệt`, "/notifications");
			return {
				ok: true,
				msg: `Đã gửi duyệt bộ quy tắc R${version}.`
			};
		},
		createMatrixDraft: (app) => {
			if (!allowed("setup", "edit", "Tạo ma trận", app)) return {
				ok: false,
				msg: "Không có quyền chỉnh sửa trong tenant hiện tại."
			};
			const s = get();
			if (!s.applications.some((a) => a.id === app)) return {
				ok: false,
				msg: "Ứng dụng không thuộc tenant hiện tại."
			};
			const existing = s.matrix.find((x) => x.app === app && [
				"Nháp",
				"Chờ duyệt",
				"Bị trả lại"
			].includes(x.status));
			if (existing) return {
				ok: false,
				msg: `Ứng dụng đã có ma trận v${existing.version} ở trạng thái ${existing.status}. (MSG-03-02)`
			};
			const active = s.matrix.find((x) => x.app === app && x.status === "Hoạt động");
			if (!active) return {
				ok: false,
				msg: "Không tìm thấy ma trận hiện hành của ứng dụng."
			};
			const draft = {
				...clone(active),
				version: active.version + 1,
				status: "Nháp",
				at: nowISO(),
				by: me(),
				approvedBy: void 0,
				approvedAt: void 0,
				req: void 0,
				returnNote: void 0,
				history: [{
					at: nowISO(),
					who: me(),
					act: "Tạo bản nháp",
					note: `Sao chép từ v${active.version}`
				}]
			};
			upd((st) => ({ matrix: [
				active,
				draft,
				...st.matrix.filter((x) => x !== active)
			] }));
			s.log("Tạo bản nháp", `Ma trận ${app} v${draft.version}`, "ok", `Sao chép từ v${active.version}`);
			return {
				ok: true,
				msg: `Đã tạo bản nháp ma trận v${draft.version}.`
			};
		},
		saveMatrixDraft: (m) => {
			if (!allowed("setup", "edit", "Lưu ma trận", m.app)) return {
				ok: false,
				msg: "Không có quyền chỉnh sửa trong tenant hiện tại."
			};
			const s = get();
			if (!s.applications.some((a) => a.id === m.app)) return {
				ok: false,
				msg: "Ứng dụng không thuộc tenant hiện tại."
			};
			const current = s.matrix.find((x) => x.app === m.app && x.version === m.version);
			if (!current || !["Nháp", "Bị trả lại"].includes(current.status)) return {
				ok: false,
				msg: "Phiên bản ma trận không còn cho phép chỉnh sửa."
			};
			const codes = m.rows.map((r) => r.fn.trim());
			if (codes.some((x) => !/^FN-\d{2}$/.test(x))) return {
				ok: false,
				msg: "Mã chức năng phải có định dạng FN-nn."
			};
			if (new Set(codes).size !== codes.length) return {
				ok: false,
				msg: `Mã chức năng đã tồn tại trong ứng dụng. (MSG-05-01)`
			};
			upd((st) => ({ matrix: st.matrix.map((x) => x.app === m.app && x.version === m.version ? {
				...clone(m),
				status: "Nháp",
				at: nowISO(),
				history: [{
					at: nowISO(),
					who: me(),
					act: "Lưu nháp"
				}, ...current.history]
			} : x) }));
			s.log("Lưu nháp", `Ma trận ${m.app} v${m.version}`);
			return {
				ok: true,
				msg: `Đã lưu bản nháp ma trận v${m.version}.`
			};
		},
		submitMatrix: (app, version) => {
			if (!allowed("setup", "edit", "Gửi duyệt ma trận", app)) return {
				ok: false,
				msg: "Không có quyền chỉnh sửa trong tenant hiện tại."
			};
			const s = get();
			if (!s.applications.some((a) => a.id === app)) return {
				ok: false,
				msg: "Ứng dụng không thuộc tenant hiện tại."
			};
			const m = s.matrix.find((x) => x.app === app && x.version === version);
			if (!m || !["Nháp", "Bị trả lại"].includes(m.status)) return {
				ok: false,
				msg: "Chỉ bản Nháp hoặc Bị trả lại mới được gửi duyệt."
			};
			const appConsents = s.consents.filter((c) => c.status === "Hoạt động" && c.apps.includes(app));
			const optionalPurposes = new Set(appConsents.filter((c) => c.kind === "Tùy chọn").flatMap((c) => c.purposes));
			const invalidOptional = m.rows.flatMap((r) => Object.entries(r.purposes).filter(([p, required]) => required && optionalPurposes.has(p)).map(([p]) => p))[0];
			if (invalidOptional) return {
				ok: false,
				msg: `Mục đích ${invalidOptional} thuộc consent tùy chọn nên không được đánh Bắt buộc. (MSG-05-03)`
			};
			const missing = appConsents.filter((c) => c.kind === "Bắt buộc" && !m.rows.some((r) => r.status !== "Ngừng" && c.purposes.some((p) => p in r.purposes)));
			if (missing.length) return {
				ok: false,
				msg: `Consent bắt buộc ${missing[0].code} chưa được gắn với chức năng nào của ứng dụng. (MSG-05-02)`
			};
			const at = nowISO();
			const req = {
				action: "Phiên bản ma trận",
				by: me(),
				byRole: s.role,
				at
			};
			upd((st) => ({ matrix: st.matrix.map((x) => x.app === app && x.version === version ? {
				...x,
				status: "Chờ duyệt",
				req,
				returnNote: void 0,
				history: [{
					at,
					who: me(),
					act: "Gửi duyệt"
				}, ...x.history]
			} : x) }));
			s.log("Gửi duyệt", `Ma trận ${app} v${version}`, "ok", void 0, "Nháp", "Chờ duyệt");
			notifyApprovers("setup", `Ma trận ${app} v${version} chờ bạn duyệt`, "/notifications");
			return {
				ok: true,
				msg: `Đã gửi duyệt ma trận v${version}.`
			};
		}
	};
	function publishNotice(id, scheduled) {
		const n = get().notices.find((x) => x.id === id);
		const at = nowISO();
		let reconsent = 0;
		upd((st) => ({ notices: st.notices.map((x) => x.id === id ? {
			...x,
			status: "Published",
			effectiveAt: scheduled ? at : x.effectiveAt || at
		} : x.consent === n.consent && x.status === "Published" ? {
			...x,
			status: "Expired"
		} : x) }));
		if ((n.material || get().notices.find((x) => x.id === id)?.material) === "Có") {
			const cur = currentStates(get().events).filter((c) => c.consent === n.consent && c.decision === "ACCEPTED");
			reconsent = cur.length;
			const evs = cur.map((c) => ({
				...c.last,
				id: uid("EV"),
				decision: "RE_CONSENT",
				ts: at,
				source: "Trực tuyến",
				channel: "Hệ thống",
				receipt: void 0,
				version: c.last.version,
				correctionOf: void 0,
				offline: void 0
			}));
			upd((st) => ({ events: [...evs, ...st.events] }));
		}
		get().log("Xuất bản phiên bản", `${n.consent} ${n.v}`, "ok", reconsent ? `Trọng yếu: ${reconsent} chủ thể chuyển RE_CONSENT, phát VERSION_CHANGED` : "Không trọng yếu: consent giữ nguyên");
	}
});
/** Trạng thái hiện hành theo cặp chủ thể × consent: sự kiện mới nhất thắng (BRL-08) */
function currentStates(events) {
	const map = /* @__PURE__ */ new Map();
	for (const e of events) {
		const k = e.subject + "|" + e.consent;
		const cur = map.get(k);
		if (!cur) map.set(k, {
			subject: e.subject,
			consent: e.consent,
			decision: e.decision,
			last: e,
			count: 1
		});
		else {
			cur.count++;
			if (e.ts > cur.last.ts) {
				cur.last = e;
				cur.decision = e.decision;
			}
		}
	}
	return [...map.values()];
}
/** Danh sách đề nghị đang chờ duyệt, gom từ mọi loại đối tượng */
function getApprovals(s) {
	const L = [];
	const cfg = (kind, arr) => arr.filter((x) => (x.status === "Chờ duyệt" || x.status === "Chờ duyệt ngừng") && x.req).forEach((x) => {
		const before = x.everActive ? snap(kind, x, s.applications) : {};
		const after = x.status === "Chờ duyệt ngừng" ? {
			...before,
			"Trạng thái": "Ngừng sử dụng"
		} : x.revision ? snap(kind, {
			...x,
			...x.revision
		}, s.applications) : snap(kind, x, s.applications);
		const keys = [.../* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)])];
		if (x.status === "Chờ duyệt ngừng") before["Trạng thái"] = "Hoạt động";
		const checks = [];
		if (kind === "purpose") {
			const p = x.revision ? {
				...x,
				...x.revision
			} : x;
			checks.push([p.items.length > 0, "Có ít nhất một loại dữ liệu trong danh mục hiện hành (BR-UC01-02)"]);
			const sens = p.items.some((i) => itemByCode(i)?.group === "Nhạy cảm");
			checks.push([!sens, sens ? "Mục đích có dữ liệu nhạy cảm: bắt buộc luồng đồng ý riêng UC-14 (BR-UC01-05)" : "Không có dữ liệu nhạy cảm"]);
			checks.push([!p.share || p.recipients.length > 0, "Có chia sẻ thì đã khai báo bên nhận"]);
			if (p.child) checks.push([false, "Cờ Trẻ em: luồng người giám hộ thuộc V1.5 (BR-UC01-10)"]);
		} else {
			const c = x;
			checks.push([c.purposes.length > 0, "Có ít nhất một mục đích Hoạt động (BR-UC02-02)"]);
			checks.push([true, "consent_code đúng định dạng và duy nhất (BR-UC02-01)"]);
		}
		L.push({
			id: `${kind}:${x.code}`,
			kind,
			ref: x.code,
			mod: "setup",
			type: label[kind],
			name: x.code,
			action: x.req.action,
			by: x.req.by,
			byRole: x.req.byRole,
			at: x.req.at,
			rows: keys.map((k) => [
				k,
				show(before[k]),
				show(after[k])
			]),
			checks,
			link: kind === "purpose" ? "/purposes" : "/consents"
		});
	});
	cfg("purpose", s.purposes);
	cfg("consent", s.consents);
	s.notices.filter((n) => n.status === "Chờ duyệt" && n.req).forEach((n) => {
		const pub = s.notices.find((x) => x.consent === n.consent && x.status === "Published");
		const f = [
			["Loại dữ liệu", "data"],
			["Mục đích", "purpose"],
			["Bên kiểm soát, xử lý, nhận", "parties"],
			["Quyền và nghĩa vụ", "rights"]
		];
		const rows = f.map(([l, k]) => [
			l + " (vi)",
			pub?.content.vi[k] || "—",
			n.content.vi[k]
		]);
		rows.push([
			"Bản tiếng Anh",
			pub ? "Có" : "—",
			n.content.en.data ? "Có" : "Không"
		]);
		L.push({
			id: `notice:${n.id}`,
			kind: "notice",
			ref: n.id,
			mod: "setup",
			type: "Phiên bản thông báo",
			name: `${n.consent} ${n.v}`,
			action: "Xuất bản",
			by: n.req.by,
			byRole: n.req.byRole,
			at: n.req.at,
			rows,
			checks: [[f.every(([, k]) => n.content.vi[k].trim().length > 0), "Đủ 4 nhóm thông tin tiếng Việt (BR-UC03-02, M1-05)"], [n.suggested !== "Có", `Hệ thống gợi ý nhãn: ${n.suggested === "Có" ? "Trọng yếu – sẽ xin lại đồng ý" : "Không trọng yếu"} (UC-04)`]],
			link: "/notices"
		});
	});
	s.banners.forEach((b) => {
		const v = b.versions[0];
		if (v.status !== "Chờ duyệt" || !v.req) return;
		const live = b.versions.find((x) => x.status === "Hoạt động");
		L.push({
			id: `banner:${b.code}`,
			kind: "banner",
			ref: b.code,
			mod: "banner",
			type: "Banner",
			name: `${b.code} v${v.v}`,
			action: "Xuất bản",
			by: v.req.by,
			byRole: v.req.byRole,
			at: v.req.at,
			rows: [
				["Kiểu hiển thị", (c) => LAYOUTS[c.layout]],
				["Tiêu đề (vi)", (c) => c.title.vi],
				["Mô tả (vi)", (c) => c.desc.vi],
				["Nút Từ chối", (c) => c.reject.vi],
				["Nút Chấp nhận", (c) => c.accept.vi],
				["Màu chủ đạo", (c) => c.color],
				["Consent hiển thị", (c) => c.consents.join(", ")]
			].map(([l, fn]) => [
				l,
				live ? fn(live.cfg) : "—",
				fn(v.cfg)
			]),
			checks: [[true, "Nút Chấp nhận và Từ chối cùng kiểu, kích thước (BR-UC07-02)"], [true, "Không có lựa chọn tick sẵn (BR-UC07-03)"]],
			link: `/banners/${b.code}`
		});
	});
	s.imports.filter((b) => b.status === "Chờ duyệt" && b.req).forEach((b) => {
		L.push({
			id: `import:${b.id}`,
			kind: "import",
			ref: b.id,
			mod: "import",
			type: "Lô import",
			name: b.id,
			action: "Ghi lô",
			by: b.req.by,
			byRole: b.req.byRole,
			at: b.req.at,
			rows: [
				[
					"Tệp",
					"—",
					b.file
				],
				[
					"Số dòng",
					"—",
					String(b.rows)
				],
				[
					"Hợp lệ",
					"—",
					String(b.ok)
				],
				[
					"Lỗi",
					"—",
					String(b.err)
				],
				[
					"Rủi ro (thiếu bằng chứng)",
					"—",
					String(b.risk)
				]
			],
			checks: [[b.riskRows.every((r) => r.decision), "Mọi dòng rủi ro đã có quyết định Giữ/Xin lại (BR-UC09-04)"], [true, "Không ghi đè sự kiện mới hơn (BR-UC09-02)"]],
			link: "/import"
		});
	});
	s.ruleSets.filter((v) => v.status === "Chờ duyệt" && v.req).forEach((v) => {
		const active = s.ruleSets.find((x) => x.status === "Hoạt động");
		const oldRows = new Map((active?.rows || []).map((r) => [r.change, r.material ? "Trọng yếu" : "Không trọng yếu"]));
		const rows = [[
			"Thời hạn mặc định",
			active ? `${active.defaultMonths} tháng` : "—",
			`${v.defaultMonths} tháng`
		], ...v.rows.map((r) => [
			r.change,
			oldRows.get(r.change) || "—",
			r.material ? "Trọng yếu" : "Không trọng yếu"
		])];
		L.push({
			id: `rule:${v.version}`,
			kind: "rule",
			ref: String(v.version),
			mod: "setup",
			type: "Bộ quy tắc tái đồng ý",
			name: `R${v.version}`,
			action: v.req.action,
			by: v.req.by,
			byRole: v.req.byRole,
			at: v.req.at,
			rows,
			checks: [[v.defaultMonths >= 1 && v.defaultMonths <= 120, "Thời hạn mặc định từ 1 đến 120 tháng (BR-UC04-05)"], [v.rows.every((r) => !r.locked || r.material), "Các thay đổi tối thiểu và dữ liệu nhạy cảm luôn là Trọng yếu (BR-UC04-01, 03)"]],
			link: "/rules"
		});
	});
	s.matrix.filter((m) => m.status === "Chờ duyệt" && m.req).forEach((m) => {
		const active = s.matrix.find((x) => x.app === m.app && x.status === "Hoạt động");
		const line = (x) => x ? x.rows.map((r) => `${r.fn} ${r.name}: ${Object.entries(r.purposes).map(([p, req]) => `${p}=${req ? "Bắt buộc" : "Không bắt buộc"}`).join(", ") || "Không liên quan"}`).join(" | ") : "—";
		const appConsents = s.consents.filter((c) => c.status === "Hoạt động" && c.apps.includes(m.app));
		const optional = new Set(appConsents.filter((c) => c.kind === "Tùy chọn").flatMap((c) => c.purposes));
		const noInvalidOptional = !m.rows.some((r) => Object.entries(r.purposes).some(([p, required]) => required && optional.has(p)));
		const allRequiredMapped = appConsents.filter((c) => c.kind === "Bắt buộc").every((c) => m.rows.some((r) => r.status !== "Ngừng" && c.purposes.some((p) => p in r.purposes)));
		L.push({
			id: `matrix:${m.app}:${m.version}`,
			kind: "matrix",
			ref: `${m.app}|${m.version}`,
			mod: "setup",
			type: "Ma trận phụ thuộc",
			name: `${m.app} v${m.version}`,
			action: m.req.action,
			by: m.req.by,
			byRole: m.req.byRole,
			at: m.req.at,
			rows: [
				[
					"Phiên bản",
					active ? `v${active.version}` : "—",
					`v${m.version}`
				],
				[
					"Hành vi khi từ chối",
					active?.onReject || "—",
					m.onReject
				],
				[
					"Chức năng và phụ thuộc",
					line(active),
					line(m)
				]
			],
			checks: [[allRequiredMapped, "Mọi consent Bắt buộc đã gắn với ít nhất một chức năng (EX-01)"], [noInvalidOptional, "Không có purpose của consent Tùy chọn bị đánh Bắt buộc (EX-02)"]],
			link: "/rules"
		});
	});
	return L.sort((a, b) => a.at > b.at ? 1 : -1);
}
//#endregion
//#region src/lib/tenant-settings-data.ts
var TENANT_SETTINGS_STORAGE_KEY = "cmp-tenant-settings-v1";
var TIME_ZONE_OPTIONS = [
	"Asia/Ho_Chi_Minh",
	"Asia/Singapore",
	"UTC"
];
var DATE_FORMAT_OPTIONS = [
	"DD/MM/YYYY",
	"MM/DD/YYYY",
	"YYYY-MM-DD"
];
var defaultTenantSettings = (tenantId) => ({
	tenantId,
	defaultLanguage: tenantId === "tenant-finance" ? "en" : "vi",
	timeZone: tenantId === "tenant-finance" ? "Asia/Singapore" : "Asia/Ho_Chi_Minh",
	dateFormat: "DD/MM/YYYY",
	privacyContactName: "",
	privacyContactEmail: "",
	privacyContactPhone: "",
	privacyContactDepartment: ""
});
function sanitizeTenantSettings(tenantId, value) {
	const fallback = defaultTenantSettings(tenantId);
	if (!value || typeof value !== "object") return fallback;
	const raw = value;
	const text = (v) => typeof v === "string" ? v.slice(0, 200) : "";
	const email = text(raw.privacyContactEmail);
	return {
		tenantId,
		defaultLanguage: raw.defaultLanguage === "vi" || raw.defaultLanguage === "en" ? raw.defaultLanguage : fallback.defaultLanguage,
		timeZone: TIME_ZONE_OPTIONS.includes(raw.timeZone) ? raw.timeZone : fallback.timeZone,
		dateFormat: DATE_FORMAT_OPTIONS.includes(raw.dateFormat) ? raw.dateFormat : fallback.dateFormat,
		privacyContactName: text(raw.privacyContactName),
		privacyContactEmail: !email || /^\S+@\S+\.\S+$/.test(email) ? email : "",
		privacyContactPhone: text(raw.privacyContactPhone),
		privacyContactDepartment: text(raw.privacyContactDepartment),
		updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : void 0
	};
}
function readTenantSettingsMap() {
	if (typeof window === "undefined") return {};
	try {
		const raw = JSON.parse(window.localStorage.getItem("cmp-tenant-settings-v1") || "{}");
		if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
		return Object.fromEntries(Object.entries(raw).map(([tenantId, value]) => [tenantId, sanitizeTenantSettings(tenantId, value)]));
	} catch {
		return {};
	}
}
function writeTenantSettingsMap(settings) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(TENANT_SETTINGS_STORAGE_KEY, JSON.stringify(settings));
}
function initializeTenantSettings(tenantId) {
	const all = readTenantSettingsMap();
	if (!all[tenantId]) {
		all[tenantId] = defaultTenantSettings(tenantId);
		writeTenantSettingsMap(all);
	}
	return all[tenantId];
}
//#endregion
//#region src/lib/platform-store.ts
var PLATFORM_PERMISSIONS = {
	"Platform Administrator": [
		"dashboard.view",
		"tenants.view",
		"tenants.create",
		"tenants.edit",
		"tenants.status",
		"audit.view"
	],
	"Platform Viewer": ["dashboard.view", "tenants.view"]
};
var canPlatform = (actor, action) => !!actor?.role && PLATFORM_PERMISSIONS[actor.role].includes(action);
var TENANT_CODE_RE = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*$/;
var initial = readPlatformSnapshot() || {
	tenants: seedPlatformTenants(),
	audit: [],
	actorId: "platform-admin"
};
var usePlatformStore = create((set, get) => {
	const actor = () => PLATFORM_ACTORS.find((a) => a.id === get().actorId);
	const commit = (patch) => {
		const next = {
			tenants: patch.tenants || get().tenants,
			audit: patch.audit || get().audit,
			actorId: patch.actorId || get().actorId
		};
		set(next);
		writePlatformSnapshot(next);
	};
	const audit = (action, tenant, metadata) => {
		const a = actor();
		if (!a?.role) return;
		const event = {
			id: `pa-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
			actorId: a.id,
			actorName: a.name,
			role: a.role,
			action,
			targetTenantId: tenant.id,
			at: (/* @__PURE__ */ new Date()).toISOString(),
			metadata
		};
		commit({ audit: [event, ...get().audit] });
	};
	return {
		...initial,
		setActor: (actorId) => {
			if (!PLATFORM_ACTORS.some((a) => a.id === actorId)) {
				commit({ actorId: "tenant-only-admin" });
				return false;
			}
			commit({ actorId });
			return true;
		},
		getActor: actor,
		createTenant: (input) => {
			if (!canPlatform(actor(), "tenants.create")) return {
				ok: false,
				msg: "Bạn không có quyền tạo tenant."
			};
			const name = input.name.trim();
			const code = input.code.trim().toUpperCase();
			const email = input.contactEmail?.trim() || "";
			const errors = {};
			if (!name) errors.name = "Tên tổ chức là bắt buộc.";
			if (!code) errors.code = "Mã tenant là bắt buộc.";
			else if (!TENANT_CODE_RE.test(code)) errors.code = "Dùng chữ in hoa, số và dấu gạch ngang; bắt đầu bằng chữ.";
			else if (get().tenants.some((t) => t.code.toUpperCase() === code)) errors.code = "Mã tenant đã tồn tại.";
			if (email && !/^\S+@\S+\.\S+$/.test(email)) errors.contactEmail = "Email không hợp lệ.";
			if (Object.keys(errors).length) return {
				ok: false,
				msg: "Vui lòng kiểm tra dữ liệu nhập.",
				errors
			};
			const now = (/* @__PURE__ */ new Date()).toISOString();
			const tenant = {
				id: `tenant-${code.toLowerCase()}-${Date.now().toString(36)}`,
				code,
				name,
				status: "ACTIVE",
				description: input.description?.trim(),
				contactEmail: email || void 0,
				createdAt: now,
				updatedAt: now
			};
			const tenants = [...get().tenants, tenant];
			commit({ tenants });
			useStore.setState((s) => ({
				tenants,
				workspaces: {
					...s.workspaces,
					[tenant.id]: createEmptyTenantWorkspace()
				}
			}));
			initializeTenantSettings(tenant.id);
			audit("TENANT_CREATED", tenant, {
				code: tenant.code,
				organizationName: tenant.name,
				status: tenant.status
			});
			return {
				ok: true,
				msg: `Đã tạo tenant ${tenant.name}.`,
				tenantId: tenant.id
			};
		},
		updateTenant: (tenantId, input) => {
			if (!canPlatform(actor(), "tenants.edit")) return {
				ok: false,
				msg: "Bạn không có quyền sửa tenant."
			};
			const current = get().tenants.find((t) => t.id === tenantId);
			if (!current) return {
				ok: false,
				msg: "Không tìm thấy tenant."
			};
			const name = input.name.trim();
			const email = input.contactEmail?.trim() || "";
			if (!name) return {
				ok: false,
				msg: "Tên tổ chức là bắt buộc."
			};
			if (email && !/^\S+@\S+\.\S+$/.test(email)) return {
				ok: false,
				msg: "Email không hợp lệ."
			};
			const next = {
				...current,
				name,
				description: input.description?.trim(),
				contactEmail: email || void 0,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			};
			const tenants = get().tenants.map((t) => t.id === tenantId ? next : t);
			commit({ tenants });
			useStore.setState({ tenants });
			audit("TENANT_UPDATED", next, {
				code: next.code,
				changedFields: "name,description,contactEmail"
			});
			return {
				ok: true,
				msg: "Đã cập nhật thông tin tenant."
			};
		},
		setTenantStatus: (tenantId, status) => {
			if (!canPlatform(actor(), "tenants.status")) return {
				ok: false,
				msg: "Bạn không có quyền đổi trạng thái tenant."
			};
			const current = get().tenants.find((t) => t.id === tenantId);
			if (!current) return {
				ok: false,
				msg: "Không tìm thấy tenant."
			};
			if (current.status === status) return {
				ok: true,
				msg: "Tenant đã ở trạng thái này."
			};
			const next = {
				...current,
				status,
				updatedAt: (/* @__PURE__ */ new Date()).toISOString()
			};
			const tenants = get().tenants.map((t) => t.id === tenantId ? next : t);
			commit({ tenants });
			useStore.setState({ tenants });
			audit(status === "ACTIVE" ? "TENANT_ACTIVATED" : "TENANT_SUSPENDED", next, {
				code: next.code,
				status
			});
			return {
				ok: true,
				msg: status === "ACTIVE" ? "Đã kích hoạt tenant." : "Đã tạm ngừng tenant; dữ liệu được giữ nguyên."
			};
		}
	};
});
//#endregion
//#region tests/mt-3-demo-flow.test.ts
var s = () => useStore.getState();
var ok = (r) => assert.equal(r.ok, true, r.msg);
var tenantId = "tenant-retail";
ok(s().setPersona("user-admin"));
var application = s().applications.find((a) => a.status === "ACTIVE");
var property = s().properties.find((p) => p.applicationId === application.id && p.status === "ACTIVE");
var consent = s().consents.find((c) => c.status === "Hoạt động");
var banner = s().banners.find((b) => b.versions.some((v) => v.status === "Hoạt động"));
var platformAuditBefore = usePlatformStore.getState().audit.length;
var draftCode = s().createBanner("consent", "Banner chưa duyệt demo", property.name);
assert.ok(draftCode);
assert.equal(s().assignPropertyIntegration(application.id, property.id, consent.code, draftCode, tenantId).ok, false);
ok(s().assignPropertyIntegration(application.id, property.id, consent.code, banner.code, tenantId));
var configured = s().properties.find((p) => p.id === property.id);
assert.deepEqual({
	consent: configured.integration?.consentCode,
	banner: configured.integration?.bannerCode,
	status: configured.integration?.status
}, {
	consent: consent.code,
	banner: banner.code,
	status: "DRAFT"
});
ok(s().publishPropertyIntegration(application.id, property.id, tenantId));
configured = s().properties.find((p) => p.id === property.id);
var deploymentId = configured.integration?.deploymentId;
assert.ok(deploymentId);
assert.equal(configured.integration?.version, 1);
assert.equal(configured.integration?.status, "PUBLISHED");
ok(s().publishPropertyIntegration(application.id, property.id, tenantId));
configured = s().properties.find((p) => p.id === property.id);
assert.equal(configured.integration?.deploymentId, deploymentId);
assert.equal(configured.integration?.version, 2);
assert.equal(readPropertySnapshot()[tenantId].find((p) => p.id === property.id)?.integration?.deploymentId, deploymentId);
var subject = "KH-DEMO-FLOW-001";
var accepted = s().recordDecision({
	subject,
	consent: consent.code,
	decision: "ACCEPTED",
	channel: `Deployment ${deploymentId}`,
	app: application.id,
	propertyId: property.id
});
assert.equal(accepted.property, property.name);
assert.equal(accepted.app, application.id);
assert.equal(accepted.decision, "ACCEPTED");
assert.equal(s().events.find((e) => e.id === accepted.id)?.id, accepted.id);
var withdrawn = s().recordDecision({
	subject,
	consent: consent.code,
	decision: "WITHDRAWN",
	channel: "Preference Center",
	app: application.id,
	propertyId: property.id,
	source: "Preference Center"
});
assert.equal(withdrawn.property, property.name);
assert.equal(withdrawn.decision, "WITHDRAWN");
ok(s().setPersona("user-dpo"));
var pkg = s().exportPackage({
	reason: "Kiểm toán nội bộ",
	scope: `Demo ${subject}`,
	subject,
	events: [accepted.id, withdrawn.id]
});
assert.deepEqual(pkg.events, [accepted.id, withdrawn.id]);
assert.ok(s().audit.some((a) => a.act === "Gán cấu hình consent" && a.obj === property.id));
assert.ok(s().audit.some((a) => a.act === "Publish cấu hình Property" && a.obj === property.id));
assert.ok(s().audit.some((a) => a.act === "Rút lại consent trong Simulator" && a.obj === withdrawn.id));
assert.equal(usePlatformStore.getState().audit.length, platformAuditBefore);
ok(s().setPersona("user-staff"));
ok(s().switchTenant("tenant-finance"));
assert.notEqual(s().properties.find((p) => p.id === property.id)?.integration?.deploymentId, deploymentId);
assert.equal(s().publishPropertyIntegration(application.id, property.id, "tenant-finance").ok, false);
console.log("MT-3 demo flow focused regression passed");
//#endregion
export {};
