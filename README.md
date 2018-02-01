# Major studio one
### project collaboration w/ Urban Ecology Lab
##### Parsons Data Visualization (MS)

X

![alt text](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/uelLogo.jpeg)
[**Live App**](http://nycfoodiverse.com/)


## data sources
###### original dataset:

- .1. [urban ecology lab - map PLUTO](https://drive.google.com/drive/u/1/folders/0B6r_XA2F-ffxc2twSlBCOUQzNTQ)

example:
![alt text](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/mapPLUTO.jpeg)


- .2. [open data NYC - restaurant inspection data](https://data.cityofnewyork.us/Health/DOHMH-New-York-City-Restaurant-Inspection-Results/xx67-kt59)

example:

| CAMIS    | DBA            | BORO      | BUILDING | STREET            | ZIPCODE | PHONE      | CUISINE DESCRIPTION | INSPECTION DATE | ACTION                                          | VIOLATION CODE | VIOLATION DESCRIPTION                                                                                                                  | CRITICAL FLAG | SCORE | GRADE | GRADE DATE | RECORD DATE | INSPECTION TYPE                          |
|----------|----------------|-----------|----------|-------------------|---------|------------|---------------------|-----------------|-------------------------------------------------|----------------|----------------------------------------------------------------------------------------------------------------------------------------|---------------|-------|-------|------------|-------------|------------------------------------------|
| 50036304 | NANOOSH        | MANHATTAN | 469      | 7TH AVE           | 10018   | 2123900563 | Mediterranean       | 7/10/15         | Violations were cited in the following area(s). | 09C            | Food contact surface not properly maintained.                                                                                          | Not Critical  | 7     | A     | 7/10/15    | 2/27/17     | Pre-permit (Operational) / Re-inspection |   

- .3. [foursquare API](https://developer.foursquare.com/)

example: [API endpoint: venue](https://api.foursquare.com/v2/venues/search?near=manhattan,%20ny&intent=browse&query=VEZZO&oauth_token=S5O343HN05HFVNXC4ZWYJ0VEUF01VCEPBLPAFR4C050DS1BD&v=20170307) |
 [API endpoint: id/search](https://api.foursquare.com/v2/venues/40a55d80f964a52020f31ee3?sort=recent&limit=500&oauth_token=S5O343HN05HFVNXC4ZWYJ0VEUF01VCEPBLPAFR4C050DS1BD&v=20170309)

 - .4. dataset I can not found but need:		

		median household income NYC (scale: per lot/block)


###### dataset after joining/parsing:
example:

| name           | address         | boro      | lat         | lng          | postcode | categories | stats | rating | text__type | text__text_extract | violation__recentScore | violation__recentTime    | violation__historyScore | violation__historyVCode | violation__closed_before | id |
|----------------|-----------------|-----------|-------------|--------------|----------|------------|-------|--------|------------|--------------------|------------------------|--------------------------|-------------------------|-------------------------|--------------------------|----|
| Paris Baguette | 136-17 39th Ave | MANHATTAN | 40.76063451 | -73.82956266 | 11354    | Bakery     | 7172  | 7.9    | liked      | comfortable        | 10                     | 2017-02-03T05:00:00.000Z | 10                      | 06C                     | null                     | 0  |
|                |                 |           |             |              |          |            |       |        |            | long               |                        |                          | 10                      | 06E                     |                          |    |
|                |                 |           |             |              |          |            |       |        |            | other              |                        |                          | 7                       | 06C                     |                          |    |
|                |                 |           |             |              |          |            |       |        |            |                    |                        |                          | 9                       | 04K                     |                          |    |
|                |                 |           |             |              |          |            |       |        |            |                    |                        |                          | 9                       | 08A                     |                          |    |



## topic
- combine Restaurant Inspection data and foursquare review/rating data, find interesting pattern between **restaurant's sanitation level (inspection data)** and what **New Yorker's real reflection (foursquare API)** about those restaurant. ```f.e: top 10 filthiest restaurants new yorker's love the most```
- find the relationship between **household income** and **restaurant sanitation problem**.
 ```f.e: base on geolocation(each street block/district), mapping income and restaurant sanitation score in the map```

###### key words:
**Sentiment analysis**: foursquare customer review text analysis. extract all _Adjectives_ / _Adverbs_ base on _positive_ / _negative_ context.

**Manhattan**: focuing all the restaurant in Mahattan(~ 5500 restaurants).

**Filthy-but-lovin'it INDEX**: Quantify the relationship between restaurant inspection score and foursquare rating (1-10).

## Design Sketches
###### plan A:
[mobile design sketches & third design sketches](https://docs.google.com/presentation/d/1yTaO_llFEzqic23P11OQmS0cofZpO43bZnlTPi4whZY/edit?usp=sharing)


[**prototype**](https://jiahao01121.github.io/Restaurant_data_viz/second_draft_mar_25/index.html)

**welcome page/Landing**:

Because All New Yorker's think NYC as **"center of the universe"**, so I decide to make the main visualization shape as a planet, in the center, **each big circle represent each violation categories**(total 78); and **all the small dots obits represents each restaurants in Manhattan**.

- on the top-right, is a navigation area, to lead reader's explore the visualization graph.

- on the bottom-right area, all the text, location, sanitation problem and foursquare review text change programmatically when you mouse over small dots(which represents each restaurants in Manhattan)

- the location of the dots in this graph is assigned by force layout algorithm, so that is **NOT mapping base on Lat,Lng**.

![alttext](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_destroyed-01.jpg)

![alttext](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_destroyed-02.jpg)

demonstrate when you **mouseover restaurants**. (sanitation problems are both shows on the tooltips and bottom-right area) :
![alt text](https://github.com/Jiahao01121/Restaurant_data_viz/blob/master/assets/restaurant_destroyed-03.jpg?raw=true)

demonstrate when you **mouseover/click(buttons in top-right) sanitation problems**. (tooltips will show the total number of restaurants which have this sanitation problem. **bottom-right area will not change text when you mouseover sannitation problems**):

![alt text](https://github.com/Jiahao01121/Restaurant_data_viz/blob/master/assets/restaurant_destroyed-04.jpg?raw=true)


demonstrate when you **click districts button**. (tooltips will show the total number of restaurants which have this sanitation problem. **bottom-right area will not change text when you mouseover sannitation problems**) :

![alttext](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_destroyed-05.jpg)


**analysis page (second slide)**:
- use Filthy-but-lovin'it INDEX, to calculate top ten restaurants that is disgusting but ppl love to go.

- the three scatterplot in the page is mapping base on **inspection score**, **restaurant grade(A,B,C)** and **foursquare rating score** respectively.

![alttext](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_destroyed-06.jpg)

demonstrate when you click top ten restaurant, it will show you detailed info about their inspection history within two years.
![alt](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_destroyed-07.jpg)

**analysis page (third slide)**:

mapping each restaurant on the map with two variables: sanitation level and household income (per st. block) and write a paragraph or two to highlight the finding.
![alttext](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_destroyed-08.jpg)


###### plan B:

[**prototype**](https://jiahao01121.github.io/Restaurant_data_viz/third_draft_mar_25/index.html)

**Landing page**:

Use map and to show each restaurants in Manhattan, and navigation button on the right hand side. because Manhattan is a narrow island, so I dicede use up and down direction to navigate though the map.

- use a lot of button to change the **level / type of measurement**
- color code base on **level / type of measurement**
- **flyby animation** when you click the nav button.
- **tooltips** show the detail info of each restaurants(sannitation problem, foursquare sentiment analysis result, etc).


![alttex](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_plan_B-01.jpg)

**analysis page (second slide)**:

This mock up shows the idea that the analysis page I want to use one chart show all the relationship between foursquare rating; inspection score, household income etc.(the form of chart haven't decided, but it definitely goona be one zoomable chart).

- the x axis is ordered by **latitude**(up-to-down).
- the y axis have lots of types/ level of measurement, that will show the relationship between each restaurant that ordered by geolocation(x axis).

![alttex](https://raw.githubusercontent.com/Jiahao01121/Restaurant_data_viz/master/assets/restaurant_plan_B-02.jpg)
