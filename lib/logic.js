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
 * Transfer a Patient to Another Organization
 * @param {org.dehr.TransferPatient} tx passed transaction body
 * @transaction
 */
async function TransferPatient(tx) {
  const factory = getFactory();
  const NS = "org.dehr";

  /* Transfer Patient */
  const patientRegistry = await getParticipantRegistry(NS + ".Patient");
  let patient = tx.patient;
  patient.organization = factory.newRelationship(
    NS,
    "Organization",
    tx.organization.getIdentifier()
  );
  await patientRegistry.update(patient);
}

/**
 * Change Permission Request Status
 * @param {org.dehr.RequestPermission} tx passed transaction body
 * @transaction
 */
async function RequestPermission(tx) {
  const factory = getFactory();
  const NS = "org.dehr";
  /* Create Permission Request */
  const permissionRequestRegistry = await getAssetRegistry(
    "org.dehr.PermissionRequest"
  );

  permissionRequests = [];
  let id =
    Math.random()
      .toString(36)
      .substring(2) + new Date().getTime().toString(36);
  let permissionRequest = factory.newResource(
    NS,
    "PermissionRequest",
    id.toString()
  );
  permissionRequest.permission = tx.permission;
  permissionRequest.status = "PENDING";
  permissionRequest.professional = tx.professional;
  await permissionRequestRegistry.add(permissionRequest);
}

/**
 * Change Permission Request Status
 * @param {org.dehr.ChangePermissionStatus} tx passed transaction body
 * @transaction
 */
async function ChangePermissionStatus(tx) {
  switch (tx.status) {
    case "GRANTED":
      await grantPermission(tx.permissionRequest);
      break;
    case "REVOKED":
      await revokePermission(tx.permissionRequest);
      break;
  }
  await setPermissionRequestStatus(
    tx.permissionRequest.permissionRequestId,
    tx.status
  );
}

/**
 * Sets the status of a permission request
 */
async function setPermissionRequestStatus(permissionRequestId, status) {
  const permissionRequestAssetRegistry = await getAssetRegistry(
    "org.dehr.PermissionRequest"
  );
  let permissionRequest = await permissionRequestAssetRegistry.get(
    permissionRequestId
  );
  permissionRequest.status = status;
  await permissionRequestAssetRegistry.update(permissionRequest);
  console.log("permissionRequest", permissionRequest);
}

/**
 * Grants a permission request
 */
async function grantPermission(permissionRequest) {
  const factory = getFactory();
  const professionalAssetRegistry = await getParticipantRegistry(
    "org.dehr.Professional"
  );
  let grantedPermission = factory.newConcept("org.dehr", "GrantedPermission");
  grantedPermission.permission = permissionRequest.permission;
  grantedPermission.permissionRequest = permissionRequest;
  let professional = await professionalAssetRegistry.get(
    permissionRequest.professional.professionalId
  );
  if (typeof professional.grantedPermissions == "undefined") {
    professional.grantedPermissions = [grantedPermission];
  } else {
    for (i of professional.grantedPermissions) {
      if (
        permissionRequest.getIdentifier() == i.permissionRequest.getIdentifier()
      ) {
        console.log("Already granted");
        return false;
      }
    }
    professional.grantedPermissions.push(grantedPermission);
  }
  await professionalAssetRegistry.update(professional);
}

/**
 * Revokes a permission
 */
async function revokePermission(permissionRequest) {
  const professionalAssetRegistry = await getParticipantRegistry(
    "org.dehr.Professional"
  );
  const factory = getFactory();
  let professional = await professionalAssetRegistry.get(
    permissionRequest.professional.professionalId
  );
  professional.grantedPermissions = professional.grantedPermissions.filter(
    function(grantedPermission) {
      return (
        grantedPermission.permissionRequest.getIdentifier() !=
        permissionRequest.permissionRequestId
      );
    }
  );
  professionalAssetRegistry.update(professional);
}

/**
 *
 * @param {org.dehr.SetupDemo} setupDemo - SetupDemo instance
 * @transaction
 */
async function setupDemo() {
  const total = 10;
  // eslint-disable-line no-unused-vars
  const factory = getFactory();
  const NS = "org.dehr";

  /* Create Organizations */
  organizations = [];
  for (let i = 0; i < total; i++) {
    let id = i + 1;
    let organization = factory.newResource(NS, "Organization", id.toString());
    organization.name = "Org " + id.toString();
    organizations[i] = organization;
  }
  const organizationRegistry = await getParticipantRegistry(
    NS + ".Organization"
  );
  await organizationRegistry.addAll(organizations);

  /* Create Patients */
  patients = [];
  const patientRegistry = await getParticipantRegistry(NS + ".Patient");
  for (let i = 0; i < total; i++) {
    let id = i + 1;
    let patient = factory.newResource(NS, "Patient", id.toString());
    patient.name = "Patient " + id.toString();
    patient.organization = factory.newRelationship(
      NS,
      "Organization",
      id.toString()
    );
    patients[i] = patient;
  }
  await patientRegistry.addAll(patients);

  /* Create Professionals */
  professionals = [];
  for (let i = 0; i < total; i++) {
    let id = i + 1;
    let professional = factory.newResource(NS, "Professional", id.toString());
    professional.name = "Dr " + id.toString();
    professional.organization = factory.newRelationship(
      NS,
      "Organization",
      id.toString()
    );
    professionals[i] = professional;
  }
  const professionalRegistry = await getParticipantRegistry(
    NS + ".Professional"
  );
  await professionalRegistry.addAll(professionals);

  /* Create healthRecord */
  const healthRecordRegistry = await getAssetRegistry(NS + ".HealthRecord");

  healthRecords = [];
  for (let i = 0; i < total; i++) {
    let id = i + 1;
    let healthRecord = factory.newResource(NS, "HealthRecord", id.toString());
    healthRecord.recordType = "IDENTITY";
    healthRecord.details = ["{sin: '" + id + "'}"];
    healthRecord.patient = factory.newRelationship(
      NS,
      "Patient",
      id.toString()
    );
    healthRecords[i] = healthRecord;
  }
  await healthRecordRegistry.addAll(healthRecords);

  /* Create Permission Request */
  const permissionRequestRegistry = await getAssetRegistry(
    NS + ".PermissionRequest"
  );

  permissionRequests = [];
  for (let i = 0; i < total; i++) {
    let id = i + 1;
    let permissionRequest = factory.newResource(
      NS,
      "PermissionRequest",
      id.toString()
    );
    let permission = factory.newConcept(NS, "Permission");
    permission.recordType = ["IDENTITY"];
    permission.writeAccess = true;
    permission.patient = factory.newRelationship(NS, "Patient", id.toString());
    permissionRequest.permission = permission;
    permissionRequest.status = "PENDING";
    permissionRequest.professional = factory.newRelationship(
      NS,
      "Professional",
      id.toString()
    );
    permissionRequests[i] = permissionRequest;
  }
  await permissionRequestRegistry.addAll(permissionRequests);
}
