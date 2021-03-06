import React from 'react';
import {createStore} from 'redux';
import {range, last} from 'lodash';

import chai, {expect} from 'chai';
import chaiEnzyme from 'chai-enzyme';
chai.use(chaiEnzyme());
import {shallow} from 'enzyme';
import {spy} from 'sinon';
import faker from 'faker';

import RegistryItem from '../src/RegistryItem';
import RegistryList from '../src/RegistryList';
import AddToRegistryForm from '../src/AddToRegistryForm';
import rootReducer from '../src/reducer';
import actualStore from '../src/store';
import {createNewItemAction} from '../src/actions';

const createRandomItems = amount => {
    return range(0, amount).map(index => {
        return {
            id: index + 1,
            name: faker.lorem.words(),
            price: faker.random.number()
        };
    });
};
const testUtilities = {
    createRandomItems,
    createOneRandomItem: () => createRandomItems(1)[0]
};

describe('<RegistryItem />', () => {

    describe('renders html', () => {

        let itemData, itemWrapper;
        beforeEach('Create a <RegistryItem /> and render it', () => {
            itemData = {
                id: 5,
                name: 'Curtains',
                price: 100
            };
            itemWrapper = shallow(<RegistryItem itemDetails={itemData}/>);
        });

        it('includes "name" as an h1', () => {
            expect(itemWrapper.find('h1')).to.have.html('<h1>Item name: <span>Curtains</span></h1>');
        });

        it('includes "price" as h2', () => {
            expect(itemWrapper.find('h2')).to.have.html('<h2>Item price: <span>100</span></h2>');
        });
    });

    describe('is interactive', () => {

        let itemData, itemWrapper, markAsPurchasedSpy;
        beforeEach('Create a <RegistryItem />', () => {
            itemData = testUtilities.createOneRandomItem();
            markAsPurchasedSpy = spy();
            itemWrapper = shallow(<RegistryItem itemDetails={itemData} markAsPurchased={markAsPurchasedSpy}/>);
        });

        it('calls props.markAsPurchased with the item id when clicked', () => {
            itemWrapper.simulate('click');
            expect(markAsPurchasedSpy.called).to.be.true;
        });        
    });

});

describe('<RegistryList />', () => {

    let randomItems;
    beforeEach('Create random example items', () => {
        randomItems = testUtilities.createRandomItems(10);
    });

    let registryListWrapper;
    beforeEach('Create <RegistryList />', () => {
        registryListWrapper = shallow(<RegistryList />);
    });

    it('starts with state.registryItems as an empty array', () => {
        const currentState = registryListWrapper.state();
        expect(currentState.registryItems).to.be.deep.equal([]);
    });


    describe('renders', () => {

        it('a <div> whose first child element is an <h1> with the text "My Registry"', () => {

            expect(registryListWrapper.is('div')).to.be.true;

            const hopefullyH1 = registryListWrapper.children().first();
            expect(hopefullyH1.is('h1')).to.be.true;
            expect(hopefullyH1.text()).to.be.equal('My Registry');

        });

        it('child <RegistryItem /> components based its current state', () => {

            registryListWrapper.setState({registryItems: randomItems});

            expect(registryListWrapper.find(RegistryItem)).to.have.length(10);

            const firstItem = registryListWrapper.find(RegistryItem).at(0);
            expect(firstItem.equals(<RegistryItem itemDetails={randomItems[0]}/>)).to.be.true;

            registryListWrapper.setState({registryItems: randomItems.slice(4)});
            expect(registryListWrapper.find(RegistryItem)).to.have.length(6);

        });

    });

});

describe('AddToRegistryForm', () => {

    let sendSpy;
    beforeEach('Create spy function to pass in', () => {
        sendSpy = spy();
    });

    let addToRegistryFormWrapper;
    beforeEach('Create <AddToRegistryForm /> wrapper', () => {
        addToRegistryFormWrapper = shallow(<AddToRegistryForm onSend={sendSpy}/>);
    });

    it('sets local state when inputs change', () => {

        expect(addToRegistryFormWrapper.state()).to.be.deep.equal({
            itemName: '',
            itemPrice: ''
        });

        const itemNameInput = addToRegistryFormWrapper.find('#item-name-field');
        itemNameInput.simulate('change', {target: {value: 'sheets'}});
        expect(addToRegistryFormWrapper.state().itemName).to.be.equal('sheets');

        const itemPriceInput = addToRegistryFormWrapper.find('#item-price-field');
        itemPriceInput.simulate('change', {target: {value: '50'}});
        expect(addToRegistryFormWrapper.state().itemPrice).to.be.equal('50');

    });

    it('calls props.onSend with its state when its form is submitted', () => {

        const formInfo = {
            itemName: 'sheets',
            itemPrice: '50',
        };

        addToRegistryFormWrapper.setState(formInfo);

        addToRegistryFormWrapper.simulate('submit');

        expect(sendSpy.called).to.be.true;
        expect(sendSpy.calledWith(formInfo)).to.be.true;

    });

});

describe('Redux architecture', () => {

    describe('action creators', () => {

        describe('createNewItemAction', () => {

            it('returns expected action description', () => {

                const item = testUtilities.createOneRandomItem();

                const actionDescriptor = createNewItemAction(item);

                expect(actionDescriptor).to.be.deep.equal({
                    type: 'ADD_ITEM_TO_REGISTRY',
                    item: item
                });

            });

        });

    });

    describe('store/reducer', () => {

        let testingStore;
        beforeEach('Create testing store from reducer', () => {
            testingStore = createStore(rootReducer);
        });

        it('has an initial state as described', () => {
            const currentStoreState = testingStore.getState();
            expect(currentStoreState.registryItems).to.be.deep.equal([]);
        });

        describe('reducing on ADD_ITEM_TO_REGISTRY', () => {

            let existingRandomItems;
            beforeEach(() => {
                existingRandomItems = testUtilities.createRandomItems(5);
                testingStore = createStore(
                    rootReducer,
                    {registryItems: existingRandomItems}
                );
            });

            it('affects the state by appending dispatched items to state registryItems', () => {

                const dispatchedItem = testUtilities.createOneRandomItem();

                testingStore.dispatch({
                    type: 'ADD_ITEM_TO_REGISTRY',
                    item: dispatchedItem
                });

                const newState = testingStore.getState();
                const lastItemOnState = last(newState.registryItems);

                expect(newState.registryItems).to.have.length(6);
                expect(lastItemOnState).to.be.deep.equal(dispatchedItem);

            });

            it('sets items to different array from previous state', () => {

                const originalState = testingStore.getState();
                const dispatchedItem = testUtilities.createOneRandomItem();

                testingStore.dispatch({
                    type: 'ADD_ITEM_TO_REGISTRY',
                    item: dispatchedItem
                });

                const newState = testingStore.getState();

                expect(newState.registryItems).to.not.be.equal(originalState.registryItems);
                expect(originalState.registryItems).to.have.length(5);

            });

        });

    });

});
