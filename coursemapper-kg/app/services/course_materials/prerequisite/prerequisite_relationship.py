import numpy as np
import pandas as pd
import ast


class PrerequisiteRelationship:
    def __init__(self, clean_data = pd.DataFrame(), related_relationships = pd.DataFrame()):

        self.data = clean_data
        self.related_relationships = related_relationships.drop_duplicates()
        main_concepts = self.related_relationships["name"].unique()
        self.prereq_unweighted = []
        self.prereq_weighted = []
        counter = 0
        # for i in range(len(main_concepts)):
        #     if main_concepts[i] == None:
        #         continue
        #     for j in range(i+1, len(main_concepts)):
        #         if main_concepts[j] == None:
        #             continue
        #         self.prerequisite_criteria(main_concepts[i],main_concepts[j],0)

        for _,r in self.related_relationships.iterrows():
            print(counter)
            if r["name"] == None or r["related_to"] == None:
                continue
            else:
                # self.prerequisite_criteria(r["name"],r["related_to"],0)
                try:
                    self.prerequisite_criteria(r["name"],r["related_to"],0.27)
                except Exception as e:
                    print(e)
            counter +=1
                
        
        self.prereq_weighted = pd.DataFrame(self.prereq_weighted)
        self.prereq_unweighted = pd.DataFrame(self.prereq_unweighted)
        if self.prereq_weighted.empty and self.prereq_unweighted.empty:
            self.prereq = pd.DataFrame(columns=['prerequisite_concept', 'concept', 'score_weighted', 'temporal_1_weighted', 'article_contents_1_weighted', 'abstract_contents_1_weighted', 'link_on_rel_abstract_1_weighted', 'refD_1_weighted', 'inlink_outlink_1_weighted', 'category_1_weighted', 'super_category_1_weighted', 'berttopic_1_weighted', 'coursemapper_channel_1_weighted', 'temporal_2_weighted', 'article_contents_2_weighted', 'abstract_contents_2_weighted', 'link_on_rel_abstract_2_weighted', 'refD_2_weighted', 'inlink_outlink_2_weighted', 'category_2_weighted', 'super_category_2_weighted', 'berttopic_2_weighted', 'coursemapper_channel_2_weighted', 'score_unweighted', 'temporal_1_unweighted', 'article_contents_1_unweighted', 'abstract_contents_1_unweighted', 'link_on_rel_abstract_1_unweighted', 'refD_1_unweighted', 'inlink_outlink_1_unweighted', 'category_1_unweighted', 'super_category_1_unweighted', 'berttopic_1_unweighted', 'coursemapper_channel_1_unweighted', 'temporal_2_unweighted', 'article_contents_2_unweighted', 'abstract_contents_2_unweighted', 'link_on_rel_abstract_2_unweighted', 'refD_2_unweighted', 'inlink_outlink_2_unweighted', 'category_2_unweighted', 'super_category_2_unweighted', 'berttopic_2_unweighted', 'coursemapper_channel_2_unweighted','weight_weighted', 'weight_unweighted'])
        elif self.prereq_weighted.empty:
            self.prereq = self.prereq_unweighted
        elif self.prereq_unweighted.empty:
            self.prereq = self.prereq_weighted
        else:
            self.prereq = self.prereq_weighted.merge(self.prereq_unweighted, how="outer",on=["prerequisite_concept","concept"],suffixes=('_weighted', '_unweighted'))
        self.prereq.drop(columns=['weight_weighted', 'weight_unweighted'],inplace=True)
        self.prereq = self.prereq.fillna(0)
        self.prereq = self.prereq.drop_duplicates()

    def unweighted_voting(self,c1,c2,c1_to_c2,c2_to_c1,c1_to_c2_real,c2_to_c1_real,theta, weighted = False):
        if weighted:
            #change this to 5.5 with coursemapper
            c1_to_c2_sum = np.sum(c1_to_c2)/5.5
            c2_to_c1_sum = np.sum(c2_to_c1)/5.5
        else:
            #change this to 10 with coursemapper
            c1_to_c2_sum = np.sum(c1_to_c2)/10
            c2_to_c1_sum = np.sum(c2_to_c1)/10
        delta = c1_to_c2_sum - c2_to_c1_sum
        if delta >= theta:
            preq_rel = {"prerequisite_concept":c1, "concept":c2, "weight": weighted, "score" : abs(delta),"temporal_1":c1_to_c2_real[0],"article_contents_1":c1_to_c2_real[1],"abstract_contents_1":c1_to_c2_real[2],"link_on_rel_abstract_1":c1_to_c2_real[3],"refD_1":c1_to_c2_real[4],"inlink_outlink_1":c1_to_c2_real[5],"category_1":c1_to_c2_real[6],"super_category_1":c1_to_c2_real[7],"berttopic_1":c1_to_c2_real[8],"coursemapper_channel_1":c1_to_c2_real[9],"temporal_2":c2_to_c1_real[0],"article_contents_2":c2_to_c1_real[1],"abstract_contents_2":c2_to_c1_real[2],"link_on_rel_abstract_2":c2_to_c1_real[3],"refD_2":c2_to_c1_real[4],"inlink_outlink_2":c2_to_c1_real[5],"category_2":c2_to_c1_real[6],"super_category_2":c2_to_c1_real[7],"berttopic_2":c2_to_c1_real[8],"coursemapper_channel_2":c2_to_c1_real[9]}
            if not weighted:
                self.prereq_unweighted.append(preq_rel)     
            else:
                self.prereq_weighted.append(preq_rel)
        if delta <= -theta:
            preq_rel = {"prerequisite_concept":c2, "concept":c1, "weight": weighted,  "score" : abs(delta),"temporal_1":c2_to_c1_real[0],"article_contents_1":c2_to_c1_real[1],"abstract_contents_1":c2_to_c1_real[2],"link_on_rel_abstract_1":c2_to_c1_real[3],"refD_1":c2_to_c1_real[4],"inlink_outlink_1":c2_to_c1_real[5],"category_1":c2_to_c1_real[6],"super_category_1":c2_to_c1_real[7],"berttopic_1":c2_to_c1_real[8],"coursemapper_channel_1":c2_to_c1_real[9],"temporal_2":c1_to_c2_real[0],"article_contents_2":c1_to_c2_real[1],"abstract_contents_2":c1_to_c2_real[2],"link_on_rel_abstract_2":c1_to_c2_real[3],"refD_2":c1_to_c2_real[4],"inlink_outlink_2":c1_to_c2_real[5],"category_2":c1_to_c2_real[6],"super_category_2":c1_to_c2_real[7],"berttopic_2":c1_to_c2_real[8],"coursemapper_channel_2":c1_to_c2_real[9]}
            if not weighted:
                self.prereq_unweighted.append(preq_rel)
            else:
                self.prereq_weighted.append(preq_rel)

    def weighted_voting(self,c1,c2,c1_to_c2,c2_to_c1,theta):
        weights = np.array([0.75, 0.5, 0.5, 0.25, 0.5, 0.5, 0.75, 0.75, 0.5, 0.5])
        c1_to_c2_new = np.multiply(c1_to_c2,weights)
        c2_to_c1_new = np.multiply(c2_to_c1,weights)
        self.unweighted_voting(c1,c2,c1_to_c2_new,c2_to_c1_new,c1_to_c2,c2_to_c1,theta,weighted=True)
                

    def prerequisite_criteria(self,c1,c2,theta):
        c1_to_c2 = np.zeros(10)
        c2_to_c1 = np.zeros(10)
        c1_to_c2[0], c2_to_c1[0] = self.temporal_order(c1,c2) # temporal order
        c1_to_c2[1], c2_to_c1[1] = self.c1_on_c2_data(c1,c2,"article_contents") # link on articles
        c1_to_c2[2], c2_to_c1[2] = self.c1_on_c2_data(c1,c2,"abstract_contents") # link on abstract
        c1_to_c2[3], c2_to_c1[3] = self.link_on_rel_abstract(c1,c2) # link on RC abstracts
        c1_to_c2[4], c2_to_c1[4] = self.refD(c1,c2,0.42) # RefD 
        c1_to_c2[5], c2_to_c1[5] = self.inlink_outlink(c1,c2) # Inlink Outlink
        c1_to_c2[6], c2_to_c1[6] = self.c1_on_c2_data(c1,c2,"category") # category
        c1_to_c2[7], c2_to_c1[7] = self.c1_on_c2_data(c1,c2,"super_category") # supercateogry
        c1_to_c2[8], c2_to_c1[8] = self.berttopic(c1,c2,1.33) # berttopic
        c1_to_c2[9], c2_to_c1[9] = self.coursemapper_channel(c1,c2) #coursemapper structure
        self.unweighted_voting(c1,c2,c1_to_c2,c2_to_c1,c1_to_c2,c2_to_c1,theta)
        self.weighted_voting(c1,c2,c1_to_c2,c2_to_c1,theta)
        
        
    
    def temporal_order(self,c1,c2):
        #if c1 is mentioned before c2, c1 is a prerequisite of c2
        try:
            c1_index = self.data.loc[self.data['name'] == c1].index[0]
            c2_index = self.data.loc[self.data['name'] == c2].index[0]
        except:
            return 0,0
        if self.data["type"].iloc[c1_index] == "main_concept" and self.data["type"].iloc[c2_index] == "main_concept":
            if c1_index < c2_index:
                return 1,0
            else:
                return 0,1
        return 0,0

    def c1_on_c2_data(self,c1,c2,column):
        c1_preq = 0
        c2_preq = 0
        try:
            c1_data = self.data[column].loc[self.data['name'] == c1].iloc[0]
            c2_data = self.data[column].loc[self.data['name'] == c2].iloc[0]
        except:
            return 0,0
        if c1 in c2_data:
            c1_preq = 1
        if c2 in c1_data:
            c2_preq = 1
        return c1_preq,c2_preq
    

    def link_on_rel_abstract(self,c1,c2):
        # if c1 is mentioned in c2's related concepts' abstract, c1 is a prerequisite of c2
        c1_preq = 0
        c2_preq = 0
        c1_rel_concepts = self.related_relationships["name"].loc[self.related_relationships["related_to"] == c1]
        c2_rel_concepts = self.related_relationships["name"].loc[self.related_relationships["related_to"] == c2]
        for concept in c2_rel_concepts:
            abstract = self.data["abstract_contents"].loc[self.data['name'] == concept].iloc[0]
            if c1 in abstract:
                c1_preq = 1
                break
        for concept in c1_rel_concepts:
            abstract = self.data["abstract_contents"].loc[self.data['name'] == concept].iloc[0]
            if c2 in abstract:
                c2_preq = 1
                break
        return c1_preq,c2_preq
    


    def refD(self,c1,c2,theta):
        w_c_a = self.data["article_contents"].loc[self.data['name'] == c1].iloc[0]
        w_c_a = ast.literal_eval(w_c_a)
        w_c_b = self.data["article_contents"].loc[self.data['name'] == c2].iloc[0]
        w_c_b = ast.literal_eval(w_c_b)
        r_c_a = self.data["name"].loc[self.data["article_contents"].str.contains(c1)].to_list()
        r_c_b = self.data["name"].loc[self.data["article_contents"].str.contains(c2)].to_list()


        if len(w_c_a) == 0:
            eq1 = 0
        else:
            eq1 = len([x for x in w_c_a if x in r_c_b])/len(w_c_a)

        if len(w_c_b) == 0:
            eq2 = 0
        else:
            eq2 = len([x for x in w_c_b if x in r_c_a])/len(w_c_b)

        
        ref_d = eq1 - eq2
        if ref_d > theta:
            return 1,0
        elif ref_d < -theta:
            return 0,1
        return 0,0

    def inlink_outlink(self,c1,c2):
        # if c1 has more inlink than c2
        c1_inlink = self.data.loc[self.data['name'] == c1,"link_ratio"].iloc[0]
        c2_inlink = self.data.loc[self.data['name'] == c2,"link_ratio"].iloc[0]
        if c1_inlink > c2_inlink:
            return 1,0
        elif c2_inlink > c1_inlink:
            return 0,1
        return 0,0

    def berttopic(self,c1,c2,theta):
        #if c1's entropy is higher than c2's then c1 is a prerequisite of c2
        c1_entropy = self.data["entropy"].loc[self.data['name'] == c1].iloc[0]
        c2_entropy = self.data["entropy"].loc[self.data['name'] == c2].iloc[0]
        delta = c1_entropy - c2_entropy

        if delta > theta:
            return 0,1
        elif delta < -theta:
            return 1,0
        return 0,0
    def coursemapper_channel(self,c1,c2):
        c1_creation_date = self.data.loc[self.data['name'] == c1,"createdAt"].iloc[0]
        c2_creation_date= self.data.loc[self.data['name'] == c2,"createdAt"].iloc[0]
        if c1_creation_date < c2_creation_date:
            return 1,0
        elif c2_creation_date < c1_creation_date:
            return 0,1
        return 0,0

    def get_prerequisite_relationships(self):
        return self.prereq
    
