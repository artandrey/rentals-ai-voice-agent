# Developer Guide: Handling Phone Number Search in twenty-crm

## Overview

This guide provides best practices and troubleshooting steps for handling phone number search and related issues in the twenty-crm codebase. It is intended to help developers avoid common pitfalls and ensure consistency between how phone numbers are stored, searched, and compared.

---

## 1. Always Use the `PhoneNumber` Value Object

- **Never** pass raw strings for phone numbers to repository methods.
- Always use the `PhoneNumber` value object, which encapsulates the number, calling code, and country code.
- Example:
  ```ts
  const phone = PhoneNumber.create('+380501231234');
  await repository.findByPhoneNumber(phone);
  ```

## 2. Repository Method Signatures

- Update repository methods to accept `PhoneNumber` objects instead of strings for phone number parameters.
- Example interface:
  ```ts
  abstract findByPhoneNumber(phoneNumber: PhoneNumber): Promise<Client | null>;
  ```

## 3. Searching by Both Number and Calling Code

- When searching for a client by phone number, always filter by both the local number and the calling code.
- Example filter:
  ```ts
  const filter = `phonenumber.primaryPhoneNumber[eq]:${phoneNumber.number},phonenumber.primaryPhoneCallingCode[eq]:${phoneNumber.callingCode}`;
  ```
- This ensures that the search is accurate and avoids mismatches due to country code differences.

## 4. Consistency Between Storage and Search

- Ensure that the way you store phone numbers (in persistence mappers) matches how you search for them.
- The `primaryPhoneNumber` should be the local number (without the calling code), and `primaryPhoneCallingCode` should be the country/calling code.
- When reconstructing a phone number from API data, always use both fields.

## 5. Updating Existing Code

- When refactoring or fixing bugs:
  1. Update all repository and service method signatures to use `PhoneNumber`.
  2. Update all usages (tests, use cases, services) to create and pass `PhoneNumber` objects.
  3. Update filters in API calls to use both number and calling code.
  4. Run and update tests to ensure correct behavior.

## 6. Troubleshooting Common Issues

- **Issue:** Search by phone number returns `null` even though the client exists.
  - **Check:** Are you passing a `PhoneNumber` object, not a string?
  - **Check:** Is the filter using both `primaryPhoneNumber` and `primaryPhoneCallingCode`?
  - **Check:** Is the number stored in the correct format (local number vs. full international)?
- **Issue:** Duplicate or mismatched results.
  - **Check:** Are you searching by both number and code, not just one?

## 7. Example: Correct Usage in a Test

```ts
const testPhone = '+380501231234';
const phoneObj = PhoneNumber.create(testPhone);
const client = await repository.findByPhoneNumber(phoneObj);
expect(client).not.toBeNull();
```

---

## Summary

- **Always use the `PhoneNumber` value object.**
- **Search and store using both number and calling code.**
- **Update all usages and tests when changing method signatures.**
- **Check for consistency and format issues if you encounter bugs.**

Following these guidelines will help prevent and quickly resolve phone number search issues in twenty-crm.
