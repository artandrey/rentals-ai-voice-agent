import { Location } from '../../domain/value-objects/location.value';
import { Price } from '../../domain/value-objects/price.value';

export function validTestPhoneNumber() {
  const prefix = '+38050123';
  const last4 = Math.floor(1000 + Math.random() * 9000);
  return `${prefix}${last4}`;
}

export function sampleLocation() {
  return new Location('Test Street', 'Test City', '123');
}

export function samplePrice() {
  return new Price(100, 'USD');
}
