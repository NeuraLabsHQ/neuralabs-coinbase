module test_contract::test {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;

    public struct TestObject has key {
        id: UID,
        value: u64
    }

    public entry fun create_test(ctx: &mut TxContext) {
        let test = TestObject {
            id: object::new(ctx),
            value: 42
        };
        transfer::transfer(test, tx_context::sender(ctx));
    }
}