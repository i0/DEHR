/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

"use strict";
/**
 * Permissions helper for ACL rules
 */

/**
 * Allows authorized professionals to have read access on health reacords
 * @param {*} professional the professional participant
 * @param {*} record the health record
 * @returns {boolean} boolean true/false
 */
function authorizedProfessionalCanReadHealthRecords(professional, record) {
  // eslint-disable-line no-unused-vars
  return professional.grantedPermissions.some(function(grantedPermission) {
    const permission = grantedPermission.permission;
    return (
      permission.recordType.indexOf(record.recordType) >= 0 &&
      permission.patient.getIdentifier() === record.patient.getIdentifier() &&
      (!permission.expiryDate ||
        new Date() < new Date(permission.expiryDate.getTime()))
    );
  });
}

/**
 * Allows authorized professionals to have write access on health reacords
 * @param {*} professional the professional participant
 * @param {*} record the health record
 * @returns {boolean} boolean true/false
 */
function authorizedProfessionalCanWriteHealthRecords(professional, record) {
  // eslint-disable-line no-unused-vars
  return professional.grantedPermissions.some(function(grantedPermission) {
    const permission = grantedPermission.permission;
    return (
      permission.writeAccess === true &&
      permission.recordType.indexOf(record.recordType) >= 0 &&
      permission.patient.getIdentifier() === record.patient.getIdentifier() &&
      (!permission.expiryDate ||
        new Date() < new Date(permission.expiryDate.getTime()))
    );
  });
}
