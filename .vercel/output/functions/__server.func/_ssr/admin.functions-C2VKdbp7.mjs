import { a as createServerFn, T as TSS_SERVER_FUNCTION, g as getServerFnById } from "./server-CDQQ5dZa.mjs";
import { r as requireSupabaseAuth } from "./auth-middleware-CffMsDA6.mjs";
import { o as objectType, s as stringType, e as enumType } from "../_libs/zod.mjs";
var createSsrRpc = (functionId) => {
  const url = "/_serverFn/" + functionId;
  const serverFnMeta = { id: functionId };
  const fn = async (...args) => {
    return (await getServerFnById(functionId))(...args);
  };
  return Object.assign(fn, {
    url,
    serverFnMeta,
    [TSS_SERVER_FUNCTION]: true
  });
};
const userIdSchema = stringType().trim().min(2).max(40).regex(/^[a-zA-Z0-9_.-]+$/, "User ID must be letters, digits, _ . -");
const pinSchema = stringType().regex(/^[0-9]{4}$/, "PIN must be 4 digits");
const ensureAdminSeeded = createServerFn({
  method: "POST"
}).handler(createSsrRpc("089a630ec02fc66e53ceabc14910eccb3c610550b8fa42bc9e99345b98106346"));
const createUserInput = objectType({
  user_id: userIdSchema,
  pin: pinSchema,
  full_name: stringType().trim().min(1).max(120),
  phone: stringType().trim().max(20).optional().nullable(),
  role: enumType(["admin", "block_officer", "cadre"]),
  cadre_type: enumType(["PRP", "FLCRP", "RBK", "IFC_Anchor", "SR_CRP"]).nullable().optional(),
  block_id: stringType().uuid().nullable().optional(),
  village: stringType().trim().min(1).max(120).nullable().optional(),
  panchayat: stringType().trim().max(120).nullable().optional(),
  gender: stringType().trim().max(20).nullable().optional(),
  join_date: stringType().trim().nullable().optional(),
  status: enumType(["Active", "Inactive"]).nullable().optional()
});
const createUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => createUserInput.parse(data)).handler(createSsrRpc("8a5ab6eb44ff34933514cd80eaebb5275eb142a889e28cbb625bede6478204b6"));
const deleteUser = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => objectType({
  id: stringType().uuid()
}).parse(data)).handler(createSsrRpc("5f15d9c6194c3264109b1c81741c60a8654b66a5caffc1ee319315a3a983394e"));
const resetUserPin = createServerFn({
  method: "POST"
}).middleware([requireSupabaseAuth]).inputValidator((data) => objectType({
  id: stringType().uuid(),
  pin: pinSchema
}).parse(data)).handler(createSsrRpc("80e0e022f8c7a4ba7e1543f04829927225ac27fbb1fdd1e972900498e87163bf"));
export {
  createUser as c,
  deleteUser as d,
  ensureAdminSeeded as e,
  resetUserPin as r
};
