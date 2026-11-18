import assert from "node:assert/strict";
import { test } from "node:test";
import { describeLinkedInError } from "./client";

test("an expired token says to renew it", () => {
  const msg = describeLinkedInError(
    "registerUpload",
    401,
    '{"status":401,"serviceErrorCode":65602,"code":"EXPIRED_ACCESS_TOKEN","message":"The token used in the request has expired"}'
  );
  assert.match(msg, /token expired or revoked/);
  assert.match(msg, /EXPIRED_ACCESS_TOKEN/);
  assert.match(msg, /LINKEDIN_ACCESS_TOKEN/);
});

test("other errors keep the status and LinkedIn's code", () => {
  const msg = describeLinkedInError(
    "ugcPosts",
    422,
    '{"code":"UNPROCESSABLE_ENTITY","message":"Bad media"}'
  );
  assert.equal(msg, "LinkedIn ugcPosts failed (422 UNPROCESSABLE_ENTITY: Bad media)");
});

test("a non-JSON body is kept as text", () => {
  assert.equal(
    describeLinkedInError("ugcPosts", 500, "upstream down"),
    "LinkedIn ugcPosts failed (500 upstream down)"
  );
});
